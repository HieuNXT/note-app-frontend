import React, { useEffect, useState, useCallback, useRef } from "react";
import ColorPicker from "./ColorPicker";
import "../styles/TextEditorStyle/TextEditor.css";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlock from "@tiptap/extension-code-block";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import FontFamily from "@tiptap/extension-font-family";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
	Box,
	Button,
	Divider,
	IconButton,
	Menu,
	MenuItem,
	Tooltip,
} from "@mui/material";
import {
	FormatBold,
	FormatItalic,
	FormatUnderlined,
	FormatColorText,
	FormatAlignLeft,
	FormatAlignCenter,
	FormatAlignRight,
	Undo,
	Redo,
	Code,
	Link as LinkIcon,
	TableChart,
	FormatListBulleted,
	FormatListNumbered,
	CheckBox,
	MoreVert,
	FormatColorFill,
    Padding,
} from "@mui/icons-material";

export type RichTextContent = string | JSONContent;

interface RichTextEditorProps {
	content: RichTextContent;
	onChange: (value: string) => void;
}

const lowlight = createLowlight(common);
const DEFAULT_TEXT_COLOR = "#000000";

const RichTextEditor: React.FC<RichTextEditorProps> = ({
	content,
	onChange,
}) => {
	// Ref flag to prevent resetting cursor on own updates
	const isPastingFromParent = useRef(false);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({ codeBlock: false }),
			Underline,
			Link.configure({ openOnClick: false }),
			TextStyle,
			Color,
			Highlight.configure({ multicolor: true }),
			FontFamily,
			Heading.configure({ levels: [1, 2, 3] }),
			BulletList,
			OrderedList,
			ListItem,
			Table.configure({ resizable: true }),
			TableRow,
			TableHeader,
			TableCell,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			CodeBlockLowlight.configure({ lowlight }),
			Placeholder.configure({ placeholder: "Start typing..." }),
			TaskList,
			TaskItem.configure({ nested: true }), // Added configuration example
			HorizontalRule,
			CodeBlock,
		],
		content:
			typeof content === "string" ? content : (content as JSONContent),
		onUpdate: ({ editor }) => {
			// Mark that this update originates from editor typing
			isPastingFromParent.current = false;
			onChange(editor.getHTML());
		},
		// Add editorProps for link handling if needed
		editorProps: {
			// attributes: {
			// 	// Add any global attributes if necessary
			// },
			// handlePaste(view, event, slice) {
			// 	// Optional: Custom paste handling
			// 	return false; // fallback to default handling
			// },
			// handleClickOn(view, pos, node, nodePos, event, direct) {
			// 	// Optional: Custom click handling (e.g., for links)
			// 	if (node.type.name === "link" && direct) {
			// 		const href = node.attrs.href;
			// 		if (href && event.metaKey) {
			// 			// Example: Open link on Meta+Click
			// 			window.open(href, "_blank");
			// 			return true; // Prevent default Tiptap link handling popup
			// 		}
			// 	}
			// 	return false; // fallback to default handling
			// },
		},
	});

	// State for the *current* selected color in the pickers / displayed on icons
	const [currentTextColor, setCurrentTextColor] =
		useState(DEFAULT_TEXT_COLOR);
	const [currentHighlightColor, setCurrentHighlightColor] =
		useState("#ffff00"); // Default yellow highlight

	// State for anchor elements of the popovers
	const [anchorElText, setAnchorElText] = useState<null | HTMLElement>(null);
	const [anchorElHighlight, setAnchorElHighlight] =
		useState<null | HTMLElement>(null);
	const [anchorElMore, setAnchorElMore] = useState<null | HTMLElement>(null); // Renamed for clarity

	// --- Event Handlers ---

	const handleTextColorClick = (event: React.MouseEvent<HTMLElement>) => {
		// Update currentTextColor based on editor selection *before* opening picker
		const activeColor =
			editor?.getAttributes("textStyle").color || DEFAULT_TEXT_COLOR;
		setCurrentTextColor(activeColor);
		setAnchorElText(event.currentTarget);
	};

	const handleHighlightClick = (event: React.MouseEvent<HTMLElement>) => {
		// Update currentHighlightColor based on editor selection *before* opening picker
		const activeHighlight =
			editor?.getAttributes("highlight").color || "#ffff00"; // Use default if none active
		setCurrentHighlightColor(activeHighlight);
		setAnchorElHighlight(event.currentTarget);
	};

	const handleTextColorChange = useCallback(
		(color: string | null): void => {
			if (!editor) return;
			if (color === null) {
				editor.chain().focus().unsetColor().run();
				setCurrentTextColor(DEFAULT_TEXT_COLOR); // Reset icon state
			} else {
				editor.chain().focus().setColor(color).run();
				setCurrentTextColor(color); // Update icon state
			}
		},
		[editor],
	); // Add editor to dependencies

	const handleHighlightChange = useCallback(
		(color: string | null) => {
			if (!editor) return;

			// Get the current text color to preserve it
			// Fallback to black if no specific color is set on the selection
			const currentSelectionTextColor =
				editor.getAttributes("textStyle").color || DEFAULT_TEXT_COLOR;

			const chain = editor.chain().focus();

			if (color === null) {
				chain.unsetHighlight();
				setCurrentHighlightColor("#ffff00"); // Reset icon state to default highlight color
			} else {
				// Apply highlight AND re-apply the current text color
				chain.setHighlight({ color }); // Use setHighlight for specific color
				// Re-apply the text color to ensure it's not lost
				chain.setColor(currentSelectionTextColor);
				setCurrentHighlightColor(color); // Update icon state
			}
			chain.run();
		},
		[editor],
	); // Add editor to dependencies

	// --- Toolbar menu state ---
	const handleMoreClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorElMore(event.currentTarget);
	};
	const handleMoreClose = () => {
		setAnchorElMore(null);
	};

	// --- Active state styling ---
	// useCallback helps prevent unnecessary re-renders of buttons if isActive logic is complex
	const isActive = useCallback(
		(action: string, attributes?: Record<string, any>) => {
			return editor?.isActive(action, attributes) ? "active-btn" : "";
		},
		[editor],
	);

	// Sync external content only when truly different
	useEffect(() => {
		if (!editor) return;
		const incoming =
			typeof content === "string" ? content : JSON.stringify(content);
		const current = editor.getHTML();
		if (isPastingFromParent.current) {
			// Reset flag and skip
			isPastingFromParent.current = false;
			return;
		}
		if (incoming !== current) {
			isPastingFromParent.current = true;
			// false: do not trigger onUpdate
			editor.commands.setContent(content as any, false);
		}
	}, [content, editor]);

	// --- Editor Styles (using sx prop) ---
	// (Keep your existing editorStyling object)
	const editorStyling = {
		border: "1px solid #bdbdbd",
		borderRadius: "4px",
		overflow: "hidden", // Keep overflow hidden for rounded corners
		display: "flex", // Added for structure
		flexDirection: "column", // Added for structure
		backgroundColor: "white", // Ensure contrast for icons

		// --- Style for the outer box focus ---
		"&:focus-within": {
			borderColor: "#1976d2", // MUI primary blue
			borderWidth: "2px",
			outline: "none",
			margin: "-1px", // Compensate for the border increase
		},

		// --- Style to target the inner editor area ---
		"& .ProseMirror": {
			// Add some padding inside the editor area
			padding: (theme: any) => theme.spacing(1, 1.5),
			flexGrow: 1,
			minHeight: "150px", // Example min height
			maxHeight: "400px", // Example max height
			overflowY: "auto", // Allow scrolling within the editor content area

			// --- Remove the default focus outline ---
			"&:focus": {
				outline: "none",
			},

			// Optional: Basic styling for content elements
			// These might be overridden by Tiptap's default styles or extensions
			p: { margin: 0, marginBottom: "0.5em" },
			ul: {
				paddingLeft: "20px",
				margin: 0,
				marginBottom: "0.5em",
			},
			ol: {
				paddingLeft: "20px",
				margin: 0,
				marginBottom: "0.5em",
			},
			'ul[data-type="taskList"]': {
				listStyle: "none",
				padding: 0,
			},
			"li[data-checked]": {
				display: "flex",
				alignItems: "center",
				gap: "8px",
			},
			'li[data-checked="true"] > div > p': {
				// Style for checked task items
				textDecoration: "line-through",
				color: "#888",
			},
			"li[data-checked] > label": { flex: "0 0 auto" },
			"li[data-checked] > div > p": { paddingBottom: "2px" },

			// Add table styling
			table: {
				borderCollapse: "collapse",
				width: "100%",
				margin: "1em 0",
				"th, td": {
					border: "1px solid #ccc",
					padding: "8px",
					minWidth: "1em", // Prevent cells from collapsing
					verticalAlign: "top",
					boxSizing: "border-box",
					position: "relative", // Needed for resizable tables
				},
				th: {
					fontWeight: "bold",
					backgroundColor: "#f1f1f1",
					textAlign: "left",
				},
				// Styles for table controls (like resizing handles)
				".grip-column, .grip-row": {
					/* Style if needed */
				},
				".selectedCell": {
					backgroundColor: "rgba(0, 0, 255, 0.1)", // Example selection style
				},
			},
			// ... other styles for code blocks, links etc.
			pre: {
				background: "#f5f5f5",
				color: "#333",
				fontFamily: "monospace",
				border: "1px solid #ddd",
				borderRadius: "4px",
				padding: "1em",
				whiteSpace: "pre-wrap", // Or 'pre'
			},
			code: {
				background: "#f5f5f5",
				padding: "0.2em 0.4em",
				borderRadius: "3px",
				fontFamily: "monospace",
				fontSize: "85%",
			},
			"pre code": {
				// Reset styles for code inside pre
				background: "none",
				padding: 0,
				borderRadius: 0,
				fontSize: "inherit",
			},
			hr: {
				border: "none",
				borderTop: "1px solid #ccc",
				margin: "1em 0",
			},
			// Placeholder styling
			"p.is-editor-empty:first-of-type::before": {
				content: "attr(data-placeholder)",
				float: "left",
				color: "#adb5bd",
				pointerEvents: "none",
				height: 0,
			},
		},
	};
	// --- Render ---
	if (!editor) return null;

	return (
		<Box sx={editorStyling}>
			{/* Toolbar */}
			<Box
				sx={{
					display: "flex",
					flexWrap: "wrap",
					gap: 0.5,
					p: 0.5,
					borderBottom: "1px solid #bdbdbd", // Keep border below toolbar
					alignItems: "center",
				}}
			>
				{/* Basic text formatting */}
				{/* Bold */}
				<Tooltip title="Bold (Ctrl+B)">
					<IconButton
						size="small" // Make buttons smaller
						className={isActive("bold")} // Use updated isActive check
						onClick={() =>
							editor.chain().focus().toggleBold().run()
						}
						disabled={!editor.can().toggleBold()} // Disable if action cannot be performed
					>
						<FormatBold />
					</IconButton>
				</Tooltip>

				{/* Italic */}
				<Tooltip title="Italic (Ctrl+I)">
					<IconButton
						size="small"
						className={isActive("italic")}
						onClick={() =>
							editor.chain().focus().toggleItalic().run()
						}
						disabled={!editor.can().toggleItalic()}
					>
						<FormatItalic />
					</IconButton>
				</Tooltip>

				{/* Underline */}
				<Tooltip title="Underline (Ctrl+U)">
					<IconButton
						size="small"
						className={isActive("underline")}
						onClick={() =>
							editor.chain().focus().toggleUnderline().run()
						}
						disabled={!editor.can().toggleUnderline()}
					>
						<FormatUnderlined />
					</IconButton>
				</Tooltip>

				<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

				{/* Font size, color, etc. */}
				{/* Text Color Button */}
				<Tooltip title="Text Color">
					<IconButton size="small" onClick={handleTextColorClick}>
						<FormatColorText
							sx={{
								color: currentTextColor, // Use state for icon color
								// Use drop-shadow for a tracing border effect
								filter: "drop-shadow(0px 0px 1px rgba(0,0,0,0.6))",
								// Ensure proper sizing if needed, but usually filter doesn't add size
								display: "inline-block", // Recommended for filter consistency
								lineHeight: 0,
							}}
						/>
					</IconButton>
				</Tooltip>
				<ColorPicker
					anchorEl={anchorElText}
					onClose={() => setAnchorElText(null)}
					onColorSelect={handleTextColorChange}
				/>

				{/* Highlight Button */}
				<Tooltip title="Highlight">
					<IconButton size="small" onClick={handleHighlightClick}>
						<FormatColorFill
							sx={{
								color: currentHighlightColor, // Use state for icon color
								// Use drop-shadow for a tracing border effect
								filter: "drop-shadow(0px 0px 1px rgba(0,0,0,0.6))",
								// Ensure proper sizing if needed
								display: "inline-block", // Recommended for filter consistency
								lineHeight: 0,
							}}
						/>
					</IconButton>
				</Tooltip>
				<ColorPicker
					anchorEl={anchorElHighlight}
					onClose={() => setAnchorElHighlight(null)}
					onColorSelect={handleHighlightChange}
				/>

				<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

				{/* Lists */}
				<Tooltip title="Bulleted List">
					<IconButton
						size="small"
						className={isActive("bulletList")}
						onClick={() =>
							editor.chain().focus().toggleBulletList().run()
						}
						disabled={!editor.can().toggleBulletList()}
					>
						<FormatListBulleted />
					</IconButton>
				</Tooltip>
				<Tooltip title="Numbered List">
					<IconButton
						size="small"
						className={isActive("orderedList")}
						onClick={() =>
							editor.chain().focus().toggleOrderedList().run()
						}
						disabled={!editor.can().toggleOrderedList()}
					>
						<FormatListNumbered />
					</IconButton>
				</Tooltip>
				<Tooltip title="Checklist">
					<IconButton
						size="small"
						className={isActive("taskList")}
						onClick={() =>
							editor.chain().focus().toggleTaskList().run()
						}
						disabled={!editor.can().toggleTaskList()}
					>
						<CheckBox />
					</IconButton>
				</Tooltip>

				<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

				{/* Undo/Redo */}
				<Tooltip title="Undo (Ctrl+Z)">
					<IconButton
						size="small"
						onClick={() => editor.chain().focus().undo().run()}
						disabled={!editor.can().undo()} // Disable if cannot undo
					>
						<Undo />
					</IconButton>
				</Tooltip>
				<Tooltip title="Redo (Ctrl+Y)">
					<IconButton
						size="small"
						onClick={() => editor.chain().focus().redo().run()}
						disabled={!editor.can().redo()} // Disable if cannot redo
					>
						<Redo />
					</IconButton>
				</Tooltip>

				{/* Placeholder for alignment, link, table if needed directly */}

				<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

				{/* More menu */}
				<Tooltip title="More Options">
					<IconButton size="small" onClick={handleMoreClick}>
						<MoreVert />
					</IconButton>
				</Tooltip>
				<Menu
					anchorEl={anchorElMore}
					open={Boolean(anchorElMore)}
					onClose={handleMoreClose}
				>
					{/* Align Center */}
					<MenuItem
						onClick={() => {
							editor.chain().focus().setTextAlign("left").run();
							handleMoreClose();
						}}
						disabled={!editor.can().setTextAlign("left")}
					>
						<FormatAlignLeft sx={{ mr: 1 }} /> Align Left
					</MenuItem>
					{/* Align Center */}
					<MenuItem
						onClick={() => {
							editor.chain().focus().setTextAlign("center").run();
							handleMoreClose();
						}}
						disabled={!editor.can().setTextAlign("center")}
						selected={editor.isActive({ textAlign: "center" })}
					>
						<FormatAlignCenter sx={{ mr: 1 }} /> Align Center
					</MenuItem>
					{/* Align Right */}
					<MenuItem
						onClick={() => {
							editor.chain().focus().setTextAlign("right").run();
							handleMoreClose();
						}}
						disabled={!editor.can().setTextAlign("right")}
						selected={editor.isActive({ textAlign: "right" })}
					>
						<FormatAlignRight sx={{ mr: 1 }} /> Align Right
					</MenuItem>
					<Divider />
					{/* Code Block */}
					<MenuItem
						onClick={() => {
							editor.chain().focus().toggleCodeBlock().run();
							handleMoreClose();
						}}
						disabled={!editor.can().toggleCodeBlock()}
						selected={editor.isActive("codeBlock")} // Add selected state
					>
						<Code sx={{ mr: 1 }} /> Code Block
					</MenuItem>
					{/* Horizontal Rule */}
					<MenuItem
						onClick={() => {
							editor.chain().focus().setHorizontalRule().run();
							handleMoreClose();
						}}
						disabled={!editor.can().setHorizontalRule()}
					>
						{/* You might want an icon for Horizontal Rule */}
						Horizontal Rule
					</MenuItem>
					{/* Link */}
					<MenuItem
						onClick={() => {
							// Basic prompt for link URL
							const url = window.prompt(
								"Enter URL",
								editor.getAttributes("link").href || "",
							);
							if (url === null) {
								// User cancelled
								return;
							}
							if (url === "") {
								// User wants to remove link
								editor
									.chain()
									.focus()
									.extendMarkRange("link")
									.unsetLink()
									.run();
							} else {
								editor
									.chain()
									.focus()
									.extendMarkRange("link")
									.setLink({ href: url, target: "_blank" })
									.run();
							}
							handleMoreClose();
						}}
						disabled={!editor.can().setLink({ href: "" })} // Check general link capability
						selected={editor.isActive("link")} // Add selected state
					>
						<LinkIcon sx={{ mr: 1 }} /> Insert/Edit Link
					</MenuItem>
					{/* Unlink */}
					<MenuItem
						onClick={() => {
							editor.chain().focus().unsetLink().run();
							handleMoreClose();
						}}
						disabled={!editor.isActive("link")} // Only enable if link is active
					>
						{/* Use LinkOff icon if available or just text */}
						Unlink
					</MenuItem>
					<Divider />
					{/* Table */}
					<MenuItem
						onClick={() => {
							editor
								.chain()
								.focus()
								.insertTable({
									rows: 3,
									cols: 3,
									withHeaderRow: true,
								})
								.run();
							handleMoreClose();
						}}
						disabled={!editor.can().insertTable()}
					>
						<TableChart sx={{ mr: 1 }} /> Insert Table
					</MenuItem>
					{/* Add more table options if needed (add row/col, delete table etc.) */}
					{/* Example: Add Column After */}
					<MenuItem
						onClick={() => {
							editor.chain().focus().addColumnAfter().run();
							handleMoreClose();
						}}
						disabled={!editor.can().addColumnAfter()} // Only enable in a table context
					>
						Add Column After
					</MenuItem>
					{/* Example: Delete Table */}
					<MenuItem
						onClick={() => {
							editor.chain().focus().deleteTable().run();
							handleMoreClose();
						}}
						disabled={!editor.can().deleteTable()} // Only enable in a table context
					>
						Delete Table
					</MenuItem>
				</Menu>
			</Box>

			{/* Editor Content Area */}
			<EditorContent editor={editor} />
		</Box>
	);
};

export default RichTextEditor;
