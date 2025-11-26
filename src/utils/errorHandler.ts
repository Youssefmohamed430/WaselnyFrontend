type FriendlyError = {
  message: string;
};

export const createFriendlyError = (error: unknown): FriendlyError => {
  if (typeof error === 'string') return { message: error };
  if (error && typeof error === 'object') {
    const anyErr = error as any;
    if (anyErr.response?.data?.message) {
      return { message: anyErr.response.data.message as string };
    }
    if (anyErr.message) {
      return { message: anyErr.message as string };
    }
  }
  return { message: 'Something went wrong. Please try again.' };
};

export const logError = (error: unknown) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};


