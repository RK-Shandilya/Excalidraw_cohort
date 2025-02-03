import { AppState } from "../types/types";

export class ToolManager {
  private state: AppState;

  constructor(state: AppState) {
    this.state = state;
  }

  setTool(tool: AppState["currentTool"]) {
    this.state.currentTool = tool;
  }

  getTool(): AppState["currentTool"] {
    return this.state.currentTool;
  }
}