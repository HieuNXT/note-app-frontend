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

interface NoteModalProps {
	noteId: string | null;
	isCreating: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const style = {
	width: 400,
	bgcolor: "white",
	p: 3,
	m: "auto",
	mt: 10,
	borderRadius: 2,
	display: "flex",
	flexDirection: "column",
};

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
	const [content, setContent] = useState("");

	useEffect(() => {
		if (note && isEditMode) {
			setTitle(note.title);
			setContent(note.content.join("\n"));
		} else if (!isEditMode) {
			setTitle("");
			setContent("");
		}
	}, [note, isEditMode, noteId]);

	const handleSave = () => {
		const contentArray = content.split("\n");

		if (isEditMode && note) {
			updateNoteMutation.mutate(
				{
					...note,
					title,
					content: contentArray,
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
				content: contentArray,
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
			<Box sx={style}>
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
						<TextField
							fullWidth
							label="Content"
							multiline
							rows={4}
							value={content}
							onChange={(e) => setContent(e.target.value)}
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
