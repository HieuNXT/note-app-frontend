import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Note, NewNote } from "../types/Note";

// Fetch notes
const fetchNotes = async (): Promise<Note[]> => {
	const { data } = await axios.get("http://localhost:5000/api/notes");
	return data.data;
};

// Hook to fetch
export const useNotes = () => {
	return useQuery<Note[]>({
		queryKey: ["notes"],
		queryFn: fetchNotes,
	});
};

// Update note
const updateNote = async (note: Note): Promise<Note> => {
	const { data } = await axios.put(
		`http://localhost:5000/api/notes/${note._id}`,
		note,
	);
	return data.data;
};

// Hook to update
export const useUpdateNote = () => {
	const queryClient = useQueryClient();

	return useMutation<Note, Error, Note>({
		mutationFn: updateNote, // Correct mutation function assignment
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notes"] }); // Refresh notes
		},
	});
};

// Add note
const addNote = async (note: NewNote): Promise<Note> => {
	const { data } = await axios.post("http://localhost:5000/api/notes/add", note);
	return data.data;
};

export const useAddNote = () => {
	const queryClient = useQueryClient();

	return useMutation<Note, unknown, NewNote>({
		mutationFn: addNote, // Correct mutation function assignment
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notes"] }); // Refresh notes
		},
	});
};
