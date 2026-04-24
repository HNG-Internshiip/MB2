import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction } from './storage';
import { getCat } from '@/constants/categories';
import { CURRENCIES } from './finance';

export async function exportCSV(transactions: Transaction[], currency: string): Promise<void> {
	const sym = CURRENCIES[currency]?.symbol ?? currency;

	const header = ['Date', 'Type', 'Category', 'Note', `Amount (${sym})`, 'Recurring', 'Interval'].join(',');

	const rows = transactions.map(t => [
		new Date(t.date).toLocaleDateString(),
		t.type,
		getCat(t.category).label,
		`"${t.note.replace(/"/g, '""')}"`,
		t.type === 'expense' ? `-${t.amount.toFixed(2)}` : t.amount.toFixed(2),
		t.recurring ? 'Yes' : 'No',
		t.recurringInterval ?? '',
	].join(','));

	const csv = [header, ...rows].join('\n');
	const filename = `transactions_${Date.now()}.csv`;
	const path = `${FileSystem.documentDirectory}${filename}`;

	await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });

	const canShare = await Sharing.isAvailableAsync();
	if (canShare) {
		await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Transactions' });
	}
}