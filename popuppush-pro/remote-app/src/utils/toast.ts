import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'info') {
  Toast.show({
    type,
    text1: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
}
