"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from "react";
import type { User, StudentProfile, Project, WrongAnswer, Evaluation } from "@/types";

// ============================================
// 全局状态类型
// ============================================
interface AppState {
  user: User | null;
  token: string | null;
  profile: StudentProfile | null;
  currentWrongAnswer: WrongAnswer | null;
  currentProject: Project | null;
  currentEvaluation: Evaluation | null;
}

type AppAction =
  | { type: "LOGIN"; user: User; token: string }
  | { type: "LOGOUT" }
  | { type: "SET_PROFILE"; profile: StudentProfile }
  | { type: "SET_CURRENT_WRONG_ANSWER"; wrongAnswer: WrongAnswer | null }
  | { type: "SET_CURRENT_PROJECT"; project: Project | null }
  | { type: "UPDATE_PROJECT_TASKS"; tasks: Project["tasks"] }
  | { type: "SET_CURRENT_EVALUATION"; evaluation: Evaluation | null }
  | { type: "INCREMENT_COMPLETED_PROJECTS" };

const initialState: AppState = {
  user: null,
  token: null,
  profile: null,
  currentWrongAnswer: null,
  currentProject: null,
  currentEvaluation: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.user, token: action.token };
    case "LOGOUT":
      return { ...initialState };
    case "SET_PROFILE":
      return { ...state, profile: action.profile };
    case "SET_CURRENT_WRONG_ANSWER":
      return { ...state, currentWrongAnswer: action.wrongAnswer };
    case "SET_CURRENT_PROJECT":
      return { ...state, currentProject: action.project };
    case "UPDATE_PROJECT_TASKS":
      if (!state.currentProject) return state;
      return {
        ...state,
        currentProject: { ...state.currentProject, tasks: action.tasks },
      };
    case "SET_CURRENT_EVALUATION":
      return { ...state, currentEvaluation: action.evaluation };
    case "INCREMENT_COMPLETED_PROJECTS":
      if (!state.profile) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          totalCompletedProjects: state.profile.totalCompletedProjects + 1,
        },
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const login = useCallback((user: User, token: string) => {
    dispatch({ type: "LOGIN", user, token });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
