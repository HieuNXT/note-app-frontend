import React, { useState } from "react";
import { useNotes, useUpdateNote } from "../hooks/useNotes";
import { CircularProgress, List, ListItem, ListItemText } from "@mui/material";
import NoteModal from "./NoteModal";

const Notes: React.FC = () => {
  const { data: notes, isLoading, error } = useNotes();
  const updateNoteMutation = useUpdateNote();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  if (isLoading) return <CircularProgress />;
  if (error) return <p>Error loading notes</p>;

  return (
    <>
      <List>
        {Array.isArray(notes) ? (
          notes.map((note) => (
            <ListItem key={note._id} onClick={() => setSelectedNoteId(note._id)} sx={{ cursor: "pointer" }}>
              <ListItemText primary={note.title} secondary={note.content.join(", ")} />
            </ListItem>            
          ))
        ) : (
          <p>No notes found</p>
        )}
      </List>
      <NoteModal
        noteId={selectedNoteId}
        onClose={() => setSelectedNoteId(null)}
        onSave={(updatedNote) => {
          updateNoteMutation.mutate(updatedNote, {
            onSuccess: () => {
              setSelectedNoteId(null); // Close modal after update
            },
          });
        }}
      />
    </>
  );
};

export default Notes;
