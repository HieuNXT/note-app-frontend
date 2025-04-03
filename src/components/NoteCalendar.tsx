import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Box } from "@mui/material";

const CalendarComponent: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <Box sx={{ width: "100%", textAlign: "center", mb: 2 }}>
      <Calendar
        onChange={(date) => setSelectedDate(date as Date)}
        value={selectedDate}
      />
    </Box>
  );
};

export default CalendarComponent;
