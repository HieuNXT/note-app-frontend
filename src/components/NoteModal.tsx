import React, { useState, useEffect } from "react";
import { Modal, Box, TextField, Button, CircularProgress } from "@mui/material";
import { Note } from "../types/Note";
import { useNote } from "../hooks/useNote";
import { useUpdateNote } from "../hooks/useNotes";

interface NoteModalProps {
  noteId: string | null;
  onClose: () => void;
  onSave: (updatedNote: Note) => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ noteId, onClose, onSave }) => {
  const { data: note, isLoading, error } = useNote(noteId); // Fetch note
  const updateNoteMutation = useUpdateNote(); // Mutation hook for saving

  const [editedNote, setEditedNote] = useState<Note | null>(null);

  useEffect(() => {
    setEditedNote(note ?? null); // Prevents TypeScript issues
  }, [note]);

  const handleSave = () => {
    if (!editedNote) return;

    updateNoteMutation.mutate(editedNote, {
      onSuccess: () => {
        onSave(editedNote);
        onClose(); // Close modal after saving
      },
    });
  };

  return (
    <Modal open={!!noteId} onClose={onClose}>
      <Box sx={{
        width: 400,
        bgcolor: "white",
        p: 3,
        m: "auto",
        mt: 10,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
      }}>
        {isLoading ? (
          <CircularProgress />
        ) : error ? (
          <p>Error loading note</p>
        ) : editedNote ? (
          <>
            <TextField
              fullWidth
              label="Title"
              variant="outlined"
              value={editedNote?.title || ""}
              onChange={(e) => setEditedNote((prev) => prev && { ...prev, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Content"
              multiline
              rows={4}
              value={editedNote?.content?.join("\n") || ""}
              onChange={(e) => setEditedNote((prev) => prev && { ...prev, content: e.target.value.split("\n") })}
            />
            <Button variant="contained" sx={{ mt: 2, mr: 2 }} onClick={handleSave}>
              Save
            </Button>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={onClose}>
              Cancel
            </Button>
          </>
        ) : (
          <p>No note selected</p>
        )}
      </Box>
    </Modal>
  );
};

export default NoteModal;
