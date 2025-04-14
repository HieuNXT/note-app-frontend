import React, { useState } from "react";
import {
	CircularProgress,
	List,
	ListItem,
	ListItemText,
	Button,
	Stack,
	Checkbox,
	Toolbar,
	Typography,
	Box,
	IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";

import { useNotes } from "../hooks/useNotes";
import NoteModal from "./NoteModal";
import { Note } from "../types/Note";
import { useChangeNotesStatus } from "../hooks/useChangeNoteStatus";

type ViewMode = "list" | "gallery";

const Notes: React.FC = () => {
	// Fetch notes
	const { data: notes, isLoading, error, refetch } = useNotes();

	// State to track IDs of selected notes.
	const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);

	// State for note creation/editing modal.
	const [isCreating, setIsCreating] = useState(false);
	const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

	// State for toggling between list and gallery view.
	const [viewMode, setViewMode] = useState<ViewMode>("list");

	// Instantiate bulk status change hook.
	const changeNotesStatusMutation = useChangeNotesStatus();
	const isSelectionMode = selectedNoteIds.length > 0;

	// Toggles a note's selection.
	const handleSelectToggle = (id: string) => {
		setSelectedNoteIds((prev) =>
			prev.includes(id)
				? prev.filter((noteId) => noteId !== id)
				: [...prev, id],
		);
	};

	// When a note is clicked:
	// - In selection mode, toggle its selection.
	// - Otherwise, open the note for editing/viewing.
	const handleNoteClick = (id: string) => {
		if (isSelectionMode) {
			handleSelectToggle(id);
		} else {
			setSelectedNoteId(id);
			setIsCreating(false);
		}
	};

	// Handler to trash the selected notes.
	const handleTrashSelected = () => {
		changeNotesStatusMutation.mutate(
			{ noteIds: selectedNoteIds, newStatus: "trashed" },
			{
				onSuccess: () => {
					setSelectedNoteIds([]);
					refetch();
				},
			},
		);
	};

	// Clears the selection mode (toolbar cancel).
	const clearSelection = () => {
		setSelectedNoteIds([]);
	};

	// Toggle view modes.
	const handleToggleView = () => {
		setViewMode((prev) => (prev === "list" ? "gallery" : "list"));
	};

	// Loading data.
	if (isLoading) return <CircularProgress />;
	if (error) return <p>Error loading notes</p>;

	// Render note items differently based on the view mode.
	// Define a common note item render function.
	const renderNoteItem = (note: Note) => (
		<Box
			key={note._id}
			onClick={() => handleNoteClick(note._id)}
			sx={{
				cursor: "pointer",
				border: "2px solid grey",
				position: "relative",
				p: 1,
				m: viewMode === "gallery" ? 1 : 0,
				width: viewMode === "gallery" ? 200 : "auto",
				"&:hover .checkbox": { opacity: 1 }, // Show checkbox on hover.
			}}
		>
			<Checkbox
				className="checkbox"
				checked={selectedNoteIds.includes(note._id)}
				onChange={() => handleSelectToggle(note._id)}
				onClick={(e) => e.stopPropagation()}
				sx={{
					position: "absolute",
					left: 8,
					top: 8,
					opacity: isSelectionMode ? 1 : 0,
					transition: "opacity 0.3s",
				}}
			/>
			{/* Note content */}
			<Box sx={{ ml: viewMode === "gallery" ? 0 : 5 }}>
				<Typography variant="h6">{note.title}</Typography>
				<Typography variant="body2" color="textSecondary">
					{note.content.join(", ")}
				</Typography>
			</Box>
		</Box>
	);

	return (
		<>
			{/* Toolbar: Only show when one or more notes are selected */}
			{isSelectionMode && (
				<Toolbar
					sx={{
						bgcolor: "grey.200",
						mb: 2,
						justifyContent: "space-between",
					}}
				>
					<Typography variant="subtitle1">
						{selectedNoteIds.length} selected
					</Typography>
					<Box>
						<Button
							onClick={handleTrashSelected}
							disabled={selectedNoteIds.length === 0}
						>
							Move to Trash
						</Button>
						<IconButton
							onClick={clearSelection}
							aria-label="cancel selection"
						>
							<CloseIcon />
						</IconButton>
					</Box>
				</Toolbar>
			)}

			<Stack
				direction="row"
				justifyContent="space-between"
				spacing={1}
				mb={2}
			>
				{!isSelectionMode && (
					<Button
						variant="contained"
						onClick={() => setIsCreating(true)}
					>
						+ New Note
					</Button>
				)}
				<Button variant="outlined" onClick={handleToggleView}>
					{viewMode === "list" ? (
						<ViewModuleIcon />
					) : (
						<ViewListIcon />
					)}
					&nbsp; {viewMode === "list" ? "Gallery" : "List"}
				</Button>
			</Stack>

			{/* Render notes based on view mode */}
			{viewMode === "list" ? (
				<List>
					{Array.isArray(notes) && notes.length > 0 ? (
						notes.map((note: Note) => (
							<ListItem
								key={note._id}
								onClick={() => handleNoteClick(note._id)}
								sx={{
									cursor: "pointer",
									border: "2px solid grey",
									position: "relative",
									p: 1,
									mb: 1,
									"&:hover .checkbox": { opacity: 1 },
								}}
							>
								<Checkbox
									className="checkbox"
									checked={selectedNoteIds.includes(note._id)}
									onChange={() =>
										handleSelectToggle(note._id)
									}
									onClick={(e) => e.stopPropagation()}
									sx={{
										position: "absolute",
										left: 8,
										top: "50%",
										transform: "translateY(-50%)",
										opacity: isSelectionMode ? 1 : 0,
										transition: "opacity 0.3s",
									}}
								/>
								<ListItemText
									primary={note.title}
									secondary={note.content.join(", ")}
									sx={{ ml: 5 }}
								/>
							</ListItem>
						))
					) : (
						<p>No notes found</p>
					)}
				</List>
			) : (
				// Gallery view using Box with flex wrapping.
				<Box sx={{ display: "flex", flexWrap: "wrap" }}>
					{Array.isArray(notes) && notes.length > 0 ? (
						notes.map((note: Note) => renderNoteItem(note))
					) : (
						<p>No notes found</p>
					)}
				</Box>
			)}

			{/* Modal for creating/updating notes; does not interfere with selection mode */}
			<NoteModal
				noteId={selectedNoteId}
				isCreating={isCreating}
				onClose={() => {
					setSelectedNoteId(null);
					setIsCreating(false);
				}}
				onSuccess={() => {
					refetch();
					setSelectedNoteId(null);
				}}
			/>
		</>
	);
};

export default Notes;
