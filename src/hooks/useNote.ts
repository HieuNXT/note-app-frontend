import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Note } from "../types/Note";

const fetchNoteById = async (id: string): Promise<Note> => {
  const { data } = await axios.get(`http://localhost:5000/api/notes/${id}`);
  return data.data; 
};

export const useNote = (id: string | null) => {
  return useQuery<Note>({
    queryKey: ["note", id],
    queryFn: () => fetchNoteById(id!),
    enabled: !!id, 
  });
};
