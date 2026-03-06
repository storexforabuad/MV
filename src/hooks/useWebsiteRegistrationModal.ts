import { useReducer, ReactNode } from 'react';

export interface RegistrationFormData {
  storeType: string | null;
  businessName: string;
  whatsapp: string;
  email: string;
  country: string;
  state: string;
  planId: string | null;
}

export type ModalScreen = 1 | 2 | 3 | 4 | 5 | 'success';

interface RegistrationState {
  currentScreen: ModalScreen;
  formData: RegistrationFormData;
  loading: boolean;
  error: string | null;
  paymentReference: string | null;
}

type RegistrationAction =
  | { type: 'NEXT_SCREEN' }
  | { type: 'PREV_SCREEN' }
  | { type: 'GO_TO_SCREEN'; payload: ModalScreen }
  | { type: 'UPDATE_FORM'; payload: Partial<RegistrationFormData> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAYMENT_REFERENCE'; payload: string }
  | { type: 'RESET' };

const initialState: RegistrationState = {
  currentScreen: 1,
  formData: {
    storeType: null,
    businessName: '',
    whatsapp: '',
    email: '',
    country: 'Nigeria',
    state: '',
    planId: null,
  },
  loading: false,
  error: null,
  paymentReference: null,
};

function registrationReducer(
  state: RegistrationState,
  action: RegistrationAction
): RegistrationState {
  switch (action.type) {
    case 'NEXT_SCREEN':
      return {
        ...state,
        currentScreen: (state.currentScreen === 'success' ? 'success' : Math.min(state.currentScreen + 1, 5)) as ModalScreen,
      };
    case 'PREV_SCREEN':
      return {
        ...state,
        currentScreen: (state.currentScreen === 'success' ? 5 : Math.max(state.currentScreen - 1, 1)) as ModalScreen,
      };
    case 'GO_TO_SCREEN':
      return {
        ...state,
        currentScreen: action.payload,
      };
    case 'UPDATE_FORM':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'SET_PAYMENT_REFERENCE':
      return {
        ...state,
        paymentReference: action.payload,
        currentScreen: 'success',
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useWebsiteRegistrationModal() {
  const [state, dispatch] = useReducer(registrationReducer, initialState);

  return {
    ...state,
    nextScreen: () => dispatch({ type: 'NEXT_SCREEN' }),
    prevScreen: () => dispatch({ type: 'PREV_SCREEN' }),
    goToScreen: (screen: ModalScreen) => dispatch({ type: 'GO_TO_SCREEN', payload: screen }),
    updateForm: (data: Partial<RegistrationFormData>) => dispatch({ type: 'UPDATE_FORM', payload: data }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    setPaymentReference: (reference: string) => dispatch({ type: 'SET_PAYMENT_REFERENCE', payload: reference }),
    reset: () => dispatch({ type: 'RESET' }),
  };
}
