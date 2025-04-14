import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

type ChangeNotesStatusParams = {
  noteIds: string[]; // Array of note IDs to update
  newStatus: "pinned" | "trashed" | "none" | "archived" | "deleted"; // Allowed statuses
};

const changeNotesStatus = async ({
  noteIds,
  newStatus,
}: ChangeNotesStatusParams): Promise<any> => {
  const { data } = await axios.patch(
    "http://localhost:5000/api/notes/changeStatus",
    { noteIds, stt: newStatus }
  );
  return data;
};

export const useChangeNotesStatus = () => {
  // Get the queryClient instance to interact with the cache.
  const queryClient = useQueryClient();

  // Return the mutation hook.
  return useMutation<any, Error, ChangeNotesStatusParams>({
    // mutationFn is our function that sends the PATCH request.
    mutationFn: changeNotesStatus,
    // onSuccess is executed after a successful response.
    // Here, we invalidate the "notes" query to refresh your notes list.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
};
