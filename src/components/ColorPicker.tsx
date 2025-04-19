import React, { useState, useEffect, useCallback } from "react";
import {
	Popover,
	Button,
	Stack,
	Box,
	Slider,
	TextField,
	IconButton,
	Tooltip,
	Typography,
} from "@mui/material";
import { FormatColorReset as FormatColorResetIcon } from "@mui/icons-material";
import { HexColorPicker } from "react-colorful";
import {
	hexToRgbObj,
	rgbObjToHex,
	adjustHsvBrightness,
	getBaseColorFromHex,
	getIntensityFromHex,
	isValidHex,
	RGB, 
} from "../utils/colorUtils"; 

interface ColorPickerProps {
	onColorSelect: (color: string | null) => void;
	anchorEl: HTMLElement | null;
	onClose: () => void;
	initialColor?: string | null; 
}

const defaultColors = [
	"#FFFFFF",
	"#E0E0E0",
	"#757575",
	"#000000",
    "#ffff00",
	"#ff0000",
	"#00ff00",
	"#0000ff",
	"#f57c00",
	"#512da8",
];

const COLOR_WHEEL_SIZE = 180;
const CONTROLS_WIDTH = 87; 
const PREVIEW_BOX_HEIGHT = 50;
const SLIDER_WIDTH = 12;

// Helper to safely convert hex to RGB, providing a default black if invalid
const safeHexToRgb = (hex: string): { r: number; g: number; b: number } => {
	return hexToRgbObj(hex) ?? { r: 0, g: 0, b: 0 };
};

const ColorPicker: React.FC<ColorPickerProps> = ({
	onColorSelect,
	anchorEl,
	onClose,
	initialColor, // Defaulting handled in useEffect
}) => {
	// --- State ---
	const [originalColorHex, setOriginalColorHex] = useState<string>("#000000"); // Store the initial color
	const [baseColor, setBaseColor] = useState("#FFFFFF"); // Base color for wheel
	const [intensity, setIntensity] = useState(100); // Intensity slider (0-100)
	const [finalHex, setFinalHex] = useState("#000000"); // The currently selected/calculated hex

	// Input states (allow temporary invalid states during typing)
	const [internalHexInput, setInternalHexInput] = useState("#000000");
	const [rgb, setRgb] = useState<RGB>({ r: 0, g: 0, b: 0 }); // Use RGB type, allows ''

	// Flag to prevent state update loops
	const [isUpdatingInternally, setIsUpdatingInternally] = useState(false);

	// --- Effects ---

	// Initialize or update state when initialColor prop changes
	useEffect(() => {
		// Determine the valid starting hex color
		let validStartHex = "#000000"; // Default to black
		if (initialColor && isValidHex(initialColor)) {
			const rgbFromInitial = hexToRgbObj(initialColor); // Util handles 3/6 digits
			if (rgbFromInitial) {
				validStartHex = rgbObjToHex(rgbFromInitial); // Ensure #RRGGBB format
			}
		}

		const initialRgb = safeHexToRgb(validStartHex);

		setIsUpdatingInternally(true); // Prevent other effects from firing
		setOriginalColorHex(validStartHex); // Store the validated initial color
		setFinalHex(validStartHex);
		setInternalHexInput(validStartHex); // Use the validated/formatted hex
		setBaseColor(getBaseColorFromHex(validStartHex));
		setIntensity(getIntensityFromHex(validStartHex));
		setRgb(initialRgb); // Set numeric RGB state
		setIsUpdatingInternally(false);
	}, [initialColor]); // Rerun only when the prop changes

	// Update Hex/RGB/Inputs when baseColor (from wheel) or intensity (from slider) changes
	useEffect(() => {
		if (isUpdatingInternally) return; // Prevent loop from self-updates

		// Recalculate finalHex based on the current baseColor and intensity
		const calculatedHex = adjustHsvBrightness(baseColor, intensity / 100);
		const calculatedRgb = safeHexToRgb(calculatedHex);

		setIsUpdatingInternally(true);
		setFinalHex(calculatedHex);
		setInternalHexInput(calculatedHex);
		setRgb(calculatedRgb); // Update RGB state with calculated numeric values
		setIsUpdatingInternally(false);
	}, [baseColor, intensity]); // Dependencies: only trigger when wheel or slider change

	// --- Handlers ---

	// Update from Color Wheel
	const handleColorWheelChange = useCallback(
		(newBaseColor: string) => {
			// Direct output from react-colorful is usually valid #RRGGBB
			if (!isUpdatingInternally && isValidHex(newBaseColor)) {
				setBaseColor(newBaseColor); // Triggers the [baseColor, intensity] useEffect
			}
		},
		[isUpdatingInternally],
	);

	// Update from Intensity Slider
	const handleIntensityChange = (
		event: Event,
		newValue: number | number[],
	) => {
		if (!isUpdatingInternally && typeof newValue === "number") {
			setIntensity(newValue); // Triggers the [baseColor, intensity] useEffect
		}
	};

	// Update from Hex Input
	const handleHexInputChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const typedValue = event.target.value;
		// Add # prefix if missing for internal consistency, but allow typing without it
		const displayValue = typedValue.startsWith("#")
			? typedValue
			: `#${typedValue}`;
		setInternalHexInput(displayValue.toUpperCase()); // Show typed value immediately (uppercase)

		if (isValidHex(displayValue)) {
			const potentialRgb = hexToRgbObj(displayValue); // Util handles 3/6 digits

			if (potentialRgb && !isUpdatingInternally) {
				const newHex = rgbObjToHex(potentialRgb); // Ensure #RRGGBB format

				setIsUpdatingInternally(true);
				setFinalHex(newHex);
				setBaseColor(getBaseColorFromHex(newHex));
				setIntensity(getIntensityFromHex(newHex));
				setRgb(potentialRgb);
				// Keep potentially shorter input like #FFF visible
				setIsUpdatingInternally(false);
			}
		}
		// If invalid (e.g., "#12"), only internalHexInput changes visually.
	};

	// Update from RGB Input Fields
	const handleRgbInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
		channel: "r" | "g" | "b",
	) => {
		const rawValue = event.target.value;

		// Validate if the input is empty or a number between 0-255
		const isValidInput =
			rawValue === "" ||
			(!isNaN(parseInt(rawValue, 10)) &&
				parseInt(rawValue, 10) >= 0 &&
				parseInt(rawValue, 10) <= 255);

		if (isValidInput) {
			// Update visual state immediately (allow empty string or the valid number)
			const displayValue = rawValue === "" ? "" : parseInt(rawValue, 10);
			const tentativeRgb = { ...rgb, [channel]: displayValue };
			setRgb(tentativeRgb);

			// Only proceed with full update if all inputs are valid (not empty)
			const rVal = tentativeRgb.r === "" ? NaN : Number(tentativeRgb.r);
			const gVal = tentativeRgb.g === "" ? NaN : Number(tentativeRgb.g);
			const bVal = tentativeRgb.b === "" ? NaN : Number(tentativeRgb.b);

			if (
				!isNaN(rVal) &&
				!isNaN(gVal) &&
				!isNaN(bVal) &&
				!isUpdatingInternally
			) {
				// All channels have valid numbers, proceed with update
				const completeRgb = { r: rVal, g: gVal, b: bVal };
				const newHex = rgbObjToHex(completeRgb);

				setIsUpdatingInternally(true);
				setFinalHex(newHex);
				setInternalHexInput(newHex);
				setBaseColor(getBaseColorFromHex(newHex));
				setIntensity(getIntensityFromHex(newHex));
				setIsUpdatingInternally(false);
			}
		}
		// If invalid input (letters, >255), do nothing to state
	};

	// Handler for selecting a default color swatch
	const handleBasicColorSelect = (color: string) => {
		if (isValidHex(color) && !isUpdatingInternally) {
			const newRgb = safeHexToRgb(color); // Use safe version
			const fullHex = rgbObjToHex(newRgb); // Ensure #RRGGBB

			setIsUpdatingInternally(true);
			setFinalHex(fullHex);
			setInternalHexInput(fullHex);
			setBaseColor(getBaseColorFromHex(fullHex));
			setIntensity(getIntensityFromHex(fullHex));
			setRgb(newRgb);
			setIsUpdatingInternally(false);
		}
	};

	// Handler for selecting "None"
	const handleNoneSelect = () => {
		onColorSelect(null);
		onClose();
	};

	// Handler for final selection confirmation
	const handleSelectColor = () => {
		// Use the `finalHex` state which should be consistent and valid #RRGGBB
		if (isValidHex(finalHex) && finalHex.length === 7) {
			onColorSelect(finalHex);
		} else {
			console.warn("Attempted to select invalid hex color:", finalHex);
			// Attempt recalculation as a fallback
			const recalculatedHex = adjustHsvBrightness(
				baseColor,
				intensity / 100,
			);
			if (isValidHex(recalculatedHex) && recalculatedHex.length === 7) {
				onColorSelect(recalculatedHex);
			} else {
				onColorSelect(originalColorHex); // Fallback to original color
			}
		}
		onClose();
	};

	return (
		<Popover
			open={Boolean(anchorEl)}
			anchorEl={anchorEl}
			onClose={onClose}
			anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
			transformOrigin={{ vertical: "top", horizontal: "left" }}
		>
			<Box sx={{ padding: 2, width: "auto" }}>
				<Box sx={{ display: "flex", gap: 2.5 }}>
					{/* --- Left Column: Picker, Slider, Defaults --- */}
					<Stack
						direction="column"
						spacing={1.5}
						sx={{ width: COLOR_WHEEL_SIZE, flexShrink: 0 }}
					>
						<Box
							sx={{
								width: COLOR_WHEEL_SIZE,
								height: COLOR_WHEEL_SIZE,
								alignSelf: "center",
							}}
						>
							<HexColorPicker
								style={{ width: "100%", height: "100%" }}
								color={baseColor}
								onChange={handleColorWheelChange}
							/>
						</Box>

						{/* Horizontal Intensity Slider Container */}
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								width: "100%",
							}}
						>
							{" "}
							{/* Parent container */}
							<Typography
								variant="caption"
								sx={{ minWidth: "25px", textAlign: "left" }}
							>
								Val:
							</Typography>
							{/* Gradient Background Box */}
							<Box
								sx={{
									height: SLIDER_WIDTH + 8, // Define overall height (track + padding)
									width: "100%", // Take available horizontal space
									flexGrow: 1, // Allow this box to grow
									borderRadius: "4px", // Keep rounded corners
									// Horizontal gradient from black to the base color
									background: `linear-gradient(to right, #000000, ${baseColor})`,
									display: "flex", // Use flex to center the slider inside
									justifyContent: "center", // Center slider horizontally (optional, width: '100%' does most work)
									alignItems: "center", // Center slider vertically
									padding: "4px 0", // Vertical padding for slider thumb clearance
								}}
							>
								<Slider
									value={intensity}
									onChange={handleIntensityChange}
									aria-label="Intensity (Brightness)"
									// orientation="horizontal" // Default, can be omitted
									min={0}
									max={100}
									sx={{
										// Use a light color for the thumb that contrasts with the gradient
										color: "rgba(255, 255, 255, 0.8)", // White thumb seems reasonable
										width: "100%", // Slider fills the gradient box width
										height: SLIDER_WIDTH, // Set the slider's track height
										padding: "0 !important", // Override MUI's default padding if needed
										"& .MuiSlider-rail": {
											display: "none", // Hide the default rail
										},
										"& .MuiSlider-track": {
											display: "none", // Hide the default track
										},
										"& .MuiSlider-thumb": {
											width: 16, // Thumb size
											height: 16, // Thumb size
											backgroundColor: "#fff", // Make thumb white for visibility
											border: "2px solid currentColor", // Use the light 'color' for the border
											// Ensure thumb doesn't get unwanted box shadow on interaction
											"&:focus, &:hover, &.Mui-active": {
												boxShadow:
													"0px 0px 0px 8px rgba(255, 255, 255, 0.16)",
												"@media (hover: none)": {
													// Reset for touch devices
													boxShadow: "none",
												},
											},
										},
									}}
								/>
							</Box>
						</Box>
						<Box>
							<Typography
								variant="caption"
								sx={{ mb: 0.5, display: "block" }}
							>
								Defaults:
							</Typography>
							<Box
								sx={{
									display: "flex",
									flexWrap: "wrap",
									gap: 1,
									alignItems: "center",
								}}
							>
								{defaultColors.map((color) => (
									<Tooltip title={color} key={color}>
										<Box
											onClick={() =>
												handleBasicColorSelect(color)
											}
											sx={{
												bgcolor: color,
												width: 22,
												height: 22,
												borderRadius: "4px",
												cursor: "pointer",
												border: (theme) =>
													`1px solid ${theme.palette.divider}`,
												"&:hover": {
													transform: "scale(1.1)",
													boxShadow: 1,
												},
												transition:
													"transform 0.1s ease-in-out",
											}}
										/>
									</Tooltip>
								))}
								<Tooltip title="Remove Color">
									<IconButton
										onClick={handleNoneSelect}
										size="small"
										sx={{
											border: (theme) =>
												`1px solid ${theme.palette.divider}`,
											borderRadius: "4px",
											width: 24,
											height: 24,
										}}
									>
										<FormatColorResetIcon
											sx={{ fontSize: 18 }}
										/>
									</IconButton>
								</Tooltip>
							</Box>
						</Box>
					</Stack>{" "}
					{/* End Left Column */}
					{/* --- Right Column: Inputs, Preview --- */}
					<Stack
						direction="column"
						spacing={1.5}
						sx={{ width: CONTROLS_WIDTH }}
					>
						<TextField
							label="Hex"
							value={internalHexInput}
							onChange={handleHexInputChange}
							variant="outlined"
							size="small"
							fullWidth
							inputProps={{
								maxLength: 7,
								style: {
									textTransform: "uppercase",
									fontFamily: "monospace",
									fontSize: "0.9rem",
									padding: "8px 10px",
								},
							}}
							sx={{ mb: 1, maxWidth: 85 }}
						/>
						{/* RGB Inputs using Box (Vertical Layout) */}
						<Box
							sx={{
								display: "flex",
								flexDirection: "column", // Stack items vertically
								gap: 1, // Spacing between R, G, B inputs
								width: "100%", // Take full width of the parent column
							}}
						>
							<TextField
								label="R"
								value={rgb.r}
								onChange={(e) => handleRgbInputChange(e, "r")}
								variant="outlined"
								size="small"
								type="number"
                                sx={{ mb: 1, maxWidth: 85 }}
							/>
							<TextField
								label="G"
								value={rgb.g}
								onChange={(e) => handleRgbInputChange(e, "g")}
								variant="outlined"
								size="small"
								type="number"
                                sx={{ mb: 1, maxWidth: 85 }}
							/>
							<TextField
								label="B"
								value={rgb.b}
								onChange={(e) => handleRgbInputChange(e, "b")}
								variant="outlined"
								size="small"
								type="number"
                                sx={{ mb: 1, maxWidth: 85 }}
							/>
						</Box>{" "}
						{/* End RGB Inputs Box */}
						{/* Color Preview Area */}
						<Stack
							sx={{
								alignItems: "center",
								flexGrow: 1,
								justifyContent: "center",
								mt: 1,
                                width: 85,
							}}
						>
							<Typography
								variant="caption"
								sx={{ lineHeight: 1.2 }}
							>
								New
							</Typography>
							<Box
								sx={{
									height: PREVIEW_BOX_HEIGHT,
									width: "50px",
									border: (theme) =>
										`1px solid ${theme.palette.divider}`,
									borderRadius: "4px",
									overflow: "hidden",
									display: "flex",
									flexDirection: "column",
									my: 0.5,
								}}
							>
								{/* New Color (Top Half) */}
								<Box
									sx={{
										flexGrow: 1,
										bgcolor: finalHex,
										width: "100%",
									}}
								/>
								{/* Current (Original) Color (Bottom Half) */}
								<Box
									sx={{
										flexGrow: 1,
										bgcolor: originalColorHex,
										width: "100%",
									}}
								/>
							</Box>
							<Typography
								variant="caption"
								sx={{ lineHeight: 1.2 }}
							>
								Current
							</Typography>
						</Stack>{" "}
						{/* End Preview Area Stack */}
					</Stack>{" "}
					{/* End Right Column */}
				</Box>{" "}
				{/* End Main Flex Content Area */}
				<Box
					sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
				>
					<Button variant="contained" onClick={handleSelectColor}>
						Select
					</Button>
				</Box>
			</Box>
		</Popover>
	);
};

export default ColorPicker;
