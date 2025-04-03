import React from "react";
import {
	Drawer,
	List,
	ListItem,
	ListItemText,
	IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

interface SidebarProps {
	open: boolean;
	toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, toggleSidebar }) => {
	return (
		<Drawer
			variant="permanent"
			sx={{
				width: open ? 200 : 60,
				transition: "width 0.3s",
				flexShrink: 0,
			}}
		>
			<IconButton onClick={toggleSidebar} sx={{ mb: 2 }}>
				<MenuIcon />
			</IconButton>
			<List>
				{["Notes", "Archive", "Calendar", "Trash"].map((text) => (
					<ListItem
						sx={{
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
						}}
						key={text}
					>
						<ListItemText primary={open ? text : ""} />
					</ListItem>
				))}
			</List>
		</Drawer>
	);
};

export default Sidebar;
