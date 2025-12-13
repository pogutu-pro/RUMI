import { AuthSlice } from '@/features/auth/stores/auth.types';
import { UiSlice } from './ui.slice';

export type AppState = AuthSlice & UiSlice;
