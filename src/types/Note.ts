export interface Note {
	_id: string;
	title: string;
	backgroundImg?: string;
	backgroundColor?: string;
	content: any;
	status: "pinned" | "trashed" | "none" | "archived" | "deleted";
	type: "reminder" | "note" | "diary" | "ideas" | "draft" | "writing" | "document" | "mind map";
	labels?: string[];
	selectedDate?: Date | null;
	createAt: Date;
	updateAt: Date;
	user: string;
  }
  
  export type NewNote = Omit<Note, "_id" | "createAt" | "updateAt">;
  