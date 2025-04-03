import React, { useState } from "react";
import { CssBaseline, Box, Container, Divider } from "@mui/material";
import Sidebar from "./components/Sidebar";
import Notes from "./components/Notes";
import CalendarComponent from "./components/NoteCalendar";

const App: React.FC = () => {
	const [sidebarOpen, setSidebarOpen] = useState(true); // Toggle sidebar

	return (
		<>
			<CssBaseline />
			<Box sx={{ display: "flex", height: "100vh" }}>
				{/* Sidebar*/}
				<Sidebar
					open={sidebarOpen}
					toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				/>

				{/*Notes */}
				<Container sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
					<h1>My Notes</h1>
					<Notes />
				</Container>

				{/*Divider */}
				<Divider
					orientation="vertical"
					sx={{ height: "calc(100% - 120px)", mt: 2 }}
				/>

				{/* Right Panel */}
				<Box
					sx={{
						width: 300,
						flexShrink: 0,
						display: "flex",
						flexDirection: "column",
						p: 2,
					}}
				>
					{/* Calendar */}
					<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
						<CalendarComponent />
					</Box>

					{/* Sticky notes */}
					<Box sx={{ flexGrow: 1, mt: 2 }}>
						<p>Special Notes Area (Coming Soon!)</p>
					</Box>
				</Box>
			</Box>
		</>
	);
};

export default App;
