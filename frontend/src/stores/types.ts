import { AuthSlice } from '@/features/auth/stores/auth.types';
import { UiStore } from './ui.store';

export type AppState = AuthSlice & UiStore;
