import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import {
  loadTransactions, saveTransactions, loadCurrency,
  Transaction, RecurringInterval, uid, TxType,
} from '@/lib/storage';
import { fmt, CURRENCIES } from '@/lib/finance';
import { CATEGORIES, getCat, CategoryId } from '@/constants/categories';
import { exportCSV } from '@/lib/export';
import theme from '@/constants/theme';

const INTERVALS: RecurringInterval[] = ['daily','weekly','monthly','yearly'];
type Filter = 'all' | 'income' | 'expense';

export default function Transactions() {
  const [txs, setTxs]           = useState<Transaction[]>([]);
  const [currency, setCurrency]  = useState('USD');
  const [filter, setFilter]      = useState<Filter>('all');
  const [showForm, setShowForm]  = useState(false);
  const [editTx, setEditTx]      = useState<Transaction | undefined>();

  // Form state
  const [type,     setType]      = useState<TxType>('expense');
  const [amount,   setAmount]    = useState('');
  const [cat,      setCat]       = useState<CategoryId>('food');
  const [note,     setNote]      = useState('');
  const [date,     setDate]      = useState(new Date().toISOString().slice(0,10));
  const [recurring,setRecurring] = useState(false);
  const [interval, setInterval]  = useState<RecurringInterval>('monthly');

  const load = useCallback(async () => {
    const [t, c] = await Promise.all([loadTransactions(), loadCurrency()]);
    setTxs(t); setCurrency(c);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAdd = () => {
    setEditTx(undefined); setType('expense'); setAmount(''); setCat('food');
    setNote(''); setDate(new Date().toISOString().slice(0,10)); setRecurring(false); setInterval('monthly');
    setShowForm(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditTx(tx); setType(tx.type); setAmount(String(tx.amount)); setCat(tx.category);
    setNote(tx.note); setDate(tx.date.slice(0,10)); setRecurring(tx.recurring);
    setInterval(tx.recurringInterval ?? 'monthly');
    setShowForm(true);
  };

  const save = async () => {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) { Alert.alert('Invalid amount'); return; }
    const entry: Transaction = {
      id: editTx?.id ?? uid(), type, amount:n, category:cat, note, currency,
      date: new Date(date).toISOString(), recurring,
      recurringInterval: recurring ? interval : undefined,
    };
    const updated = editTx ? txs.map(t => t.id === editTx.id ? entry : t) : [entry, ...txs];
    setTxs(updated); await saveTransactions(updated); setShowForm(false);
  };

  const remove = (id: string) => {
    Alert.alert('Delete', 'Remove this transaction?', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        const updated = txs.filter(t => t.id !== id);
        setTxs(updated); await saveTransactions(updated);
      }},
    ]);
  };

  const filtered = txs
    .filter(t => filter === 'all' ? true : t.type === filter)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const availCats = CATEGORIES.filter(c => c.type === type || c.type === 'both');

  return (
    <SafeAreaView style={s.safe} edges={['top','left','right']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Transactions</Text>
          <Text style={s.sub}>{txs.length} total</Text>
        </View>
        <View style={s.headerBtns}>
          <TouchableOpacity style={s.iconBtn} onPress={() => exportCSV(txs, currency)}>
            <Ionicons name="download-outline" size={20} color={theme.subtext} />
          </TouchableOpacity>
          <TouchableOpacity style={s.addBtn} onPress={openAdd}>
            <Ionicons name="add" size={18} color="#111" />
            <Text style={s.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={s.filterRow}>
        {(['all','income','expense'] as Filter[]).map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter===f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter===f && {
              color: f==='income' ? theme.income : f==='expense' ? theme.expense : theme.gold
            }]}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom:100 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={48} color={theme.border} />
            <Text style={s.emptyText}>No transactions found</Text>
          </View>
        )}
        {filtered.map(tx => {
          const c = getCat(tx.category);
          return (
            <View key={tx.id} style={s.txCard}>
              <View style={[s.txIcon, { backgroundColor:`${c.color}22` }]}>
                <Ionicons name={c.icon as any} size={22} color={c.color} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.txNote} numberOfLines={1}>{tx.note || c.label}</Text>
                <View style={s.txMetaRow}>
                  <View style={[s.catChip, { backgroundColor:`${c.color}18` }]}>
                    <Text style={[s.catChipText, { color:c.color }]}>{c.label}</Text>
                  </View>
                  <Text style={s.txDate}>{new Date(tx.date).toLocaleDateString('en',{month:'short',day:'numeric',year:'2-digit'})}</Text>
                  {tx.recurring && <Ionicons name="refresh-circle-outline" size={13} color={theme.purple} />}
                </View>
              </View>
              <View style={s.txRight}>
                <Text style={[s.txAmt, { color: tx.type==='income' ? theme.income : theme.expense }]}>
                  {tx.type==='income'?'+':'-'}{fmt(tx.amount, currency)}
                </Text>
                <View style={s.txActions}>
                  <TouchableOpacity onPress={() => openEdit(tx)}>
                    <Ionicons name="pencil-outline" size={15} color={theme.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(tx.id)}>
                    <Ionicons name="trash-outline" size={15} color={theme.expense} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Add/Edit Form ── */}
      {showForm && (
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.overlay}>
          <TouchableOpacity style={s.backdrop} onPress={() => setShowForm(false)} activeOpacity={1} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{editTx ? 'Edit Transaction' : 'New Transaction'}</Text>

            {/* Type toggle */}
            <View style={s.typeToggle}>
              {(['expense','income'] as TxType[]).map(t => (
                <TouchableOpacity key={t} style={[s.typeBtn, type===t && { backgroundColor: t==='income' ? theme.incomeDim : theme.expenseDim, borderColor: t==='income' ? `${theme.income}55` : `${theme.expense}55` }]}
                  onPress={() => { setType(t); setCat(t==='income'?'salary':'food'); }}>
                  <Ionicons name={t==='income'?'arrow-down':'arrow-up'} size={14} color={type===t ? (t==='income'?theme.income:theme.expense) : theme.muted} />
                  <Text style={[s.typeBtnText, type===t && { color: t==='income'?theme.income:theme.expense }]}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount */}
            <Text style={s.label}>AMOUNT ({CURRENCIES[currency]?.symbol})</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputPrefix}>{CURRENCIES[currency]?.symbol}</Text>
              <TextInput style={s.amtInput} keyboardType="numeric" placeholder="0.00" placeholderTextColor={theme.muted}
                value={amount} onChangeText={setAmount} autoFocus />
            </View>

            {/* Category */}
            <Text style={s.label}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:14 }}>
              {availCats.map(c => (
                <TouchableOpacity key={c.id} style={[s.catPill, cat===c.id && { borderColor:c.color, backgroundColor:`${c.color}18` }]}
                  onPress={() => setCat(c.id)}>
                  <Ionicons name={c.icon as any} size={13} color={cat===c.id ? c.color : theme.muted} />
                  <Text style={[s.catPillText, cat===c.id && { color:c.color }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Note + Date */}
            <View style={s.rowInputs}>
              <View style={{ flex:2 }}>
                <Text style={s.label}>NOTE</Text>
                <View style={s.inputWrap}>
                  <TextInput style={s.textInput} placeholder="Description…" placeholderTextColor={theme.muted}
                    value={note} onChangeText={setNote} />
                </View>
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.label}>DATE</Text>
                <View style={s.inputWrap}>
                  <TextInput style={s.textInput} placeholder="YYYY-MM-DD" placeholderTextColor={theme.muted}
                    value={date} onChangeText={setDate} />
                </View>
              </View>
            </View>

            {/* Recurring */}
            <TouchableOpacity style={s.recurRow} onPress={() => setRecurring(r => !r)}>
              <View style={[s.recurCheck, recurring && { backgroundColor:theme.purple, borderColor:theme.purple }]}>
                {recurring && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={s.recurLabel}>Recurring transaction</Text>
            </TouchableOpacity>

            {recurring && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:14 }}>
                {INTERVALS.map(iv => (
                  <TouchableOpacity key={iv} style={[s.catPill, interval===iv && { borderColor:theme.purple, backgroundColor:theme.purpleDim }]}
                    onPress={() => setInterval(iv)}>
                    <Text style={[s.catPillText, interval===iv && { color:theme.purple }]}>{iv}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={s.formBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: type==='income' ? theme.income : theme.expense }]} onPress={save}>
                <Ionicons name="checkmark" size={16} color="#111" />
                <Text style={s.saveBtnText}>{editTx ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:theme.bg },
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:theme.border },
  title:        { fontSize:26, fontWeight:'800', color:theme.text },
  sub:          { fontSize:12, color:theme.muted },
  headerBtns:   { flexDirection:'row', alignItems:'center', gap:10 },
  iconBtn:      { width:40, height:40, borderRadius:12, backgroundColor:theme.card, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:theme.border },
  addBtn:       { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:theme.gold, borderRadius:14, paddingHorizontal:16, paddingVertical:9 },
  addBtnText:   { color:'#111', fontWeight:'700', fontSize:13 },
  filterRow:    { flexDirection:'row', backgroundColor:theme.surface, borderBottomWidth:1, borderBottomColor:theme.border },
  filterBtn:    { flex:1, paddingVertical:11, alignItems:'center', borderBottomWidth:2, borderBottomColor:'transparent' },
  filterActive: { borderBottomColor:theme.gold },
  filterText:   { fontSize:13, fontWeight:'600', color:theme.muted },
  body:         { flex:1, padding:14 },
  empty:        { alignItems:'center', paddingTop:80, gap:12 },
  emptyText:    { color:theme.muted, fontSize:14 },
  txCard:       { flexDirection:'row', alignItems:'center', backgroundColor:theme.card, borderRadius:16, padding:14, marginBottom:8, gap:12, borderWidth:1, borderColor:theme.border },
  txIcon:       { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0 },
  txNote:       { fontSize:14, fontWeight:'600', color:theme.text },
  txMetaRow:    { flexDirection:'row', alignItems:'center', gap:6, marginTop:4 },
  catChip:      { borderRadius:6, paddingHorizontal:7, paddingVertical:2 },
  catChipText:  { fontSize:10, fontWeight:'700' },
  txDate:       { fontSize:11, color:theme.muted },
  txRight:      { alignItems:'flex-end', gap:6 },
  txAmt:        { fontSize:15, fontWeight:'700' },
  txActions:    { flexDirection:'row', gap:10 },
  // Form
  overlay:      { ...StyleSheet.absoluteFillObject, justifyContent:'flex-end', zIndex:99 },
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.65)' },
  sheet:        { backgroundColor:theme.card, borderTopLeftRadius:28, borderTopRightRadius:28, padding:20, paddingBottom:Platform.OS==='ios'?40:28, borderWidth:1, borderColor:theme.border, maxHeight:'90%' },
  sheetHandle:  { width:40, height:4, backgroundColor:theme.border, borderRadius:2, alignSelf:'center', marginBottom:14 },
  sheetTitle:   { fontSize:18, fontWeight:'700', color:theme.text, marginBottom:16 },
  typeToggle:   { flexDirection:'row', gap:10, marginBottom:16 },
  typeBtn:      { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:11, borderRadius:12, borderWidth:1, borderColor:theme.border, backgroundColor:theme.surface },
  typeBtnText:  { fontSize:14, fontWeight:'700', color:theme.muted },
  label:        { fontSize:10, color:theme.muted, fontWeight:'700', letterSpacing:1, marginBottom:6, textTransform:'uppercase' },
  inputWrap:    { flexDirection:'row', alignItems:'center', backgroundColor:theme.surface, borderRadius:12, paddingHorizontal:14, borderWidth:1, borderColor:theme.border, marginBottom:14 },
  inputPrefix:  { fontSize:20, color:theme.subtext, marginRight:6 },
  amtInput:     { flex:1, fontSize:28, fontWeight:'700', color:theme.text, paddingVertical:12 },
  textInput:    { flex:1, fontSize:14, color:theme.text, paddingVertical:12 },
  catPill:      { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:8, borderRadius:20, borderWidth:1, borderColor:theme.border, marginRight:8, backgroundColor:theme.surface },
  catPillText:  { fontSize:12, fontWeight:'600', color:theme.muted },
  rowInputs:    { flexDirection:'row', gap:10 },
  recurRow:     { flexDirection:'row', alignItems:'center', gap:10, marginBottom:14 },
  recurCheck:   { width:22, height:22, borderRadius:6, borderWidth:2, borderColor:theme.muted, alignItems:'center', justifyContent:'center' },
  recurLabel:   { fontSize:14, color:theme.subtext },
  formBtns:     { flexDirection:'row', gap:10 },
  cancelBtn:    { flex:1, backgroundColor:theme.surface, borderRadius:14, padding:14, alignItems:'center', borderWidth:1, borderColor:theme.border },
  cancelText:   { color:theme.muted, fontWeight:'700', fontSize:15 },
  saveBtn:      { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, borderRadius:14, padding:14 },
  saveBtnText:  { color:'#111', fontWeight:'800', fontSize:15 },
});