import React, { useState, useEffect } from "react";
import {
	Modal,
	Box,
	TextField,
	Button,
	CircularProgress,
	Stack,
} from "@mui/material";
import { NewNote } from "../types/Note";
import { useNote } from "../hooks/useNote";
import { useUpdateNote, useAddNote } from "../hooks/useNotes";
import RichTextEditor, { RichTextContent } from "./TextEditor";

interface NoteModalProps {
	noteId: string | null;
	isCreating: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const NoteModal: React.FC<NoteModalProps> = ({
	noteId,
	isCreating,
	onClose,
	onSuccess,
}) => {
	const isEditMode = !!noteId;

	const { data: note, isLoading, error } = useNote(noteId); // only used in edit mode
	const updateNoteMutation = useUpdateNote();
	const addNoteMutation = useAddNote();

	const [title, setTitle] = useState("");
	const [content, setContent] = useState<RichTextContent>("");

	useEffect(() => {
		if (note && isEditMode) {
			setTitle(note.title);
			setContent(note.content.join("\n"));
		} else if (!isEditMode) {
			setTitle("");
			setContent("");
		}
	}, [note, isEditMode, noteId]);

	const handleEditorChange = (updated: RichTextContent) => {
		setContent(updated);
	};
	const handleSave = () => {
		if (isEditMode && note) {
			updateNoteMutation.mutate(
				{
					...note,
					title,
					content,
					updateAt: new Date(),
				},
				{
					onSuccess: () => {
						onSuccess();
						onClose();
					},
				},
			);
		} else {
			const newNote: NewNote = {
				title,
				content,
				status: "none",
				type: "note",
				labels: [],
				backgroundColor: "#ffffff",
				selectedDate: null,
				user: "user123", // hardcoded or passed in later
			};

			addNoteMutation.mutate(newNote, {
				onSuccess: () => {
					onSuccess();
					onClose();
				},
			});
		}
	};

	return (
		<Modal open={!!noteId || isCreating} onClose={onClose}>
			<Box
				sx={{
					width: "50vw",
					maxWidth: "none",
					bgcolor: "background.paper",
					p: 4,
					margin: "auto",
					mt: "10vh", // just for vertical centering
					borderRadius: 2,
					boxShadow: 24,
				}}
			>
				{isEditMode && isLoading ? (
					<CircularProgress />
				) : isEditMode && error ? (
					<p>Error loading note</p>
				) : (
					<>
						<TextField
							fullWidth
							label="Title"
							variant="outlined"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							sx={{ mb: 2 }}
						/>
						<RichTextEditor
							content={content}
							onChange={handleEditorChange}
						/>
						<Stack
							direction="row"
							justifyContent="flex-end"
							spacing={1}
							mt={2}
						>
							<Button onClick={onClose}>Cancel</Button>
							<Button variant="contained" onClick={handleSave}>
								{isEditMode ? "Update" : "Create"}
							</Button>
						</Stack>
					</>
				)}
			</Box>
		</Modal>
	);
};

export default NoteModal;
