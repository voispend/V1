import { Alert } from 'react-native';

export const handleDeleteExpense = (
  id: string, 
  deleteExpense: (id: string) => void,
  title: string = 'Delete Expense',
  message: string = 'Are you sure you want to delete this expense?'
) => {
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) }
    ]
  );
};
