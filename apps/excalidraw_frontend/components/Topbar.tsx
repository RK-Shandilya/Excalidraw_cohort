import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Minus, MousePointer, TypeIcon, Hand, ArrowRight, Eraser } from "lucide-react";
import { Tool } from "./Canvas";

export function Topbar({selectedTool, setSelectedTool}: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void
}) {
    return <div style={{
            position: "fixed",
            top: 10,
            left: "45%",
        }}>
            <div className="flex gap-2 rounded-md p-2 bg-slate-700">
                <IconButton 
                    onClick={() => {
                        setSelectedTool("pan")
                    }}
                    activated={selectedTool === "pan"}
                    icon={<Hand color="white" size={15}/>}
                />
                <IconButton onClick={() => {
                    setSelectedTool("selection")
                }} activated={selectedTool === "selection"} icon={<MousePointer color="white" size={15} fill={`${selectedTool=="selection" ? "white": "transparent"}`}/>}></IconButton>
                <IconButton 
                    onClick={() => {
                        setSelectedTool("pencil")
                    }}
                    activated={selectedTool === "pencil"}
                    icon={<Pencil color="white" size={15}/>}
                />
                <IconButton onClick={() => {
                    setSelectedTool("rect")
                }} activated={selectedTool === "rect"} icon={<RectangleHorizontalIcon color="white" size={15} fill={`${selectedTool=="rect" ? "white": "transparent"}`}/>}></IconButton>
                <IconButton onClick={() => {
                    setSelectedTool("circle")
                }} activated={selectedTool === "circle"} icon={<Circle color="white" size={15} fill={`${selectedTool=="circle" ? "white": "transparent"}`}/>}></IconButton>
                <IconButton onClick={() => {
                    setSelectedTool("line")
                }} activated={selectedTool === "line"} icon={<Minus color="white" size={15}/>}></IconButton>
                <IconButton 
                    onClick={() => {
                        setSelectedTool("arrow")
                    }}
                    activated={selectedTool === "arrow"}
                    icon={<ArrowRight color="white" size={15}/>}
                />
                <IconButton 
                    onClick={() => {
                        setSelectedTool("text")
                    }}
                    activated={selectedTool === "text"}
                    icon={<TypeIcon color="white" size={15}/>}
                />
                <IconButton 
                    onClick={() => {
                        setSelectedTool("eraser")
                    }}
                    activated={selectedTool === "eraser"}
                    icon={<Eraser color="white" size={15}/>}
                />
            </div>
        </div>
}