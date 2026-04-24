import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { loadTransactions, loadBudgets, saveBudgets, loadCurrency, Budget, uid } from '@/lib/storage';
import { fmt, budgetSpent, CURRENCIES } from '@/lib/finance';
import { CATEGORIES, getCat, CategoryId } from '@/constants/categories';
import { Transaction } from '@/lib/storage';
import theme from '@/constants/theme';

export default function BudgetScreen() {
  const [txs,      setTxs]      = useState<Transaction[]>([]);
  const [budgets,  setBudgets]  = useState<Budget[]>([]);
  const [currency, setCurr]     = useState('USD');
  const [showForm, setShowForm] = useState(false);
  const [editB,    setEditB]    = useState<Budget|undefined>();

  // Form
  const [cat,    setCat]    = useState<CategoryId>('food');
  const [limit,  setLimit]  = useState('');
  const [period, setPeriod] = useState<'weekly'|'monthly'>('monthly');
  const [cur,    setCur]    = useState('USD');

  const load = useCallback(async () => {
    const [t,b,c] = await Promise.all([loadTransactions(), loadBudgets(), loadCurrency()]);
    setTxs(t); setBudgets(b); setCurr(c); setCur(c);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAdd = () => {
    setEditB(undefined); setCat('food'); setLimit(''); setPeriod('monthly');
    setShowForm(true);
  };
  const openEdit = (b: Budget) => {
    setEditB(b); setCat(b.category); setLimit(String(b.limit)); setPeriod(b.period); setCur(b.currency);
    setShowForm(true);
  };

  const save = async () => {
    const n = parseFloat(limit);
    if (isNaN(n) || n <= 0) { Alert.alert('Enter a valid limit'); return; }
    const entry: Budget = { id: editB?.id ?? uid(), category:cat, limit:n, period, currency:cur };
    const updated = editB ? budgets.map(b => b.id===editB.id ? entry : b) : [...budgets, entry];
    setBudgets(updated); await saveBudgets(updated); setShowForm(false);
  };

  const remove = (id: string) => {
    Alert.alert('Delete Budget', 'Remove this budget?', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        const updated = budgets.filter(b => b.id !== id);
        setBudgets(updated); await saveBudgets(updated);
      }},
    ]);
  };

  const expCats = CATEGORIES.filter(c => c.type === 'expense' || c.type === 'both');

  return (
    <SafeAreaView style={s.safe} edges={['top','left','right']}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Budgets</Text>
          <Text style={s.sub}>{budgets.length} active budget{budgets.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={18} color="#111" />
          <Text style={s.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom:100 }} showsVerticalScrollIndicator={false}>
        {budgets.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="wallet-outline" size={52} color={theme.border} />
            <Text style={s.emptyTitle}>No budgets yet</Text>
            <Text style={s.emptyText}>Set spending limits by category to stay on track.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
              <Ionicons name="add-circle-outline" size={16} color={theme.income} />
              <Text style={s.emptyBtnText}>Create First Budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          budgets.map(b => {
            const cat     = getCat(b.category);
            const spent   = budgetSpent(b, txs);
            const pct     = Math.min(spent / b.limit, 1);
            const over    = spent > b.limit;
            const near    = !over && pct > 0.8;
            const barClr  = over ? theme.expense : near ? theme.gold : theme.income;
            const remaining = b.limit - spent;

            return (
              <View key={b.id} style={[s.budgetCard, over && { borderColor:`${theme.expense}44` }]}>
                {/* Top row */}
                <View style={s.budgetTopRow}>
                  <View style={[s.budgetIcon, { backgroundColor:`${cat.color}22` }]}>
                    <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <View style={{ flex:1 }}>
                    <View style={s.budgetTitleRow}>
                      <Text style={s.budgetCat}>{cat.label}</Text>
                      {over && (
                        <View style={s.overBadge}>
                          <Ionicons name="warning" size={11} color={theme.expense} />
                          <Text style={s.overText}>Over budget</Text>
                        </View>
                      )}
                      {near && !over && (
                        <View style={[s.overBadge, { backgroundColor:theme.goldDim, borderColor:`${theme.gold}33` }]}>
                          <Ionicons name="alert-circle" size={11} color={theme.gold} />
                          <Text style={[s.overText, { color:theme.gold }]}>Near limit</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.budgetPeriod}>{b.period.charAt(0).toUpperCase()+b.period.slice(1)} budget</Text>
                  </View>
                  <View style={s.budgetActions}>
                    <TouchableOpacity onPress={() => openEdit(b)} style={s.actBtn}>
                      <Ionicons name="pencil-outline" size={15} color={theme.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => remove(b.id)} style={s.actBtn}>
                      <Ionicons name="trash-outline" size={15} color={theme.expense} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={s.barBg}>
                  <View style={[s.barFill, { width:`${pct*100}%`, backgroundColor:barClr }]} />
                </View>

                {/* Amounts */}
                <View style={s.amtRow}>
                  <Text style={s.spent}>{fmt(spent, b.currency)} spent</Text>
                  <Text style={s.pctText}>{Math.round(pct*100)}%</Text>
                  <Text style={[s.remaining, { color: over ? theme.expense : theme.income }]}>
                    {over ? `${fmt(Math.abs(remaining), b.currency)} over` : `${fmt(remaining, b.currency)} left`}
                  </Text>
                </View>
                <Text style={s.limitLabel}>Limit: {fmt(b.limit, b.currency)}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Form ── */}
      {showForm && (
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.overlay}>
          <TouchableOpacity style={s.backdrop} onPress={() => setShowForm(false)} activeOpacity={1} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{editB ? 'Edit Budget' : 'New Budget'}</Text>

            <Text style={s.label}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:14 }}>
              {expCats.map(c => (
                <TouchableOpacity key={c.id} style={[s.catPill, cat===c.id && { borderColor:c.color, backgroundColor:`${c.color}18` }]}
                  onPress={() => setCat(c.id)}>
                  <Ionicons name={c.icon as any} size={13} color={cat===c.id ? c.color : theme.muted} />
                  <Text style={[s.catPillText, cat===c.id && { color:c.color }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>SPENDING LIMIT ({CURRENCIES[cur]?.symbol})</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputPrefix}>{CURRENCIES[cur]?.symbol}</Text>
              <TextInput style={s.amtInput} keyboardType="numeric" placeholder="0.00"
                placeholderTextColor={theme.muted} value={limit} onChangeText={setLimit} autoFocus />
            </View>

            <Text style={s.label}>PERIOD</Text>
            <View style={s.periodRow}>
              {(['weekly','monthly'] as const).map(p => (
                <TouchableOpacity key={p} style={[s.periodBtn, period===p && s.periodActive]} onPress={() => setPeriod(p)}>
                  <Ionicons name={p==='weekly'?'calendar-outline':'calendar'} size={14} color={period===p?theme.income:theme.muted} />
                  <Text style={[s.periodText, period===p && { color:theme.income }]}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.formBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={save}>
                <Ionicons name="checkmark" size={16} color="#111" />
                <Text style={s.saveBtnText}>{editB ? 'Save' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex:1, backgroundColor:theme.bg },
  header:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:theme.border },
  title:         { fontSize:26, fontWeight:'800', color:theme.text },
  sub:           { fontSize:12, color:theme.muted },
  addBtn:        { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:theme.income, borderRadius:14, paddingHorizontal:16, paddingVertical:9 },
  addBtnText:    { color:'#111', fontWeight:'700', fontSize:13 },
  body:          { flex:1, padding:16 },
  empty:         { alignItems:'center', paddingTop:80, gap:10 },
  emptyTitle:    { fontSize:18, fontWeight:'700', color:theme.text },
  emptyText:     { fontSize:13, color:theme.muted, textAlign:'center', lineHeight:20 },
  emptyBtn:      { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:theme.incomeDim, borderRadius:12, paddingHorizontal:18, paddingVertical:10, marginTop:6, borderWidth:1, borderColor:`${theme.income}33` },
  emptyBtnText:  { color:theme.income, fontWeight:'700', fontSize:14 },
  budgetCard:    { backgroundColor:theme.card, borderRadius:20, padding:18, marginBottom:14, borderWidth:1, borderColor:theme.border },
  budgetTopRow:  { flexDirection:'row', alignItems:'center', gap:12, marginBottom:14 },
  budgetIcon:    { width:46, height:46, borderRadius:14, alignItems:'center', justifyContent:'center' },
  budgetTitleRow:{ flexDirection:'row', alignItems:'center', gap:8, flexWrap:'wrap' },
  budgetCat:     { fontSize:16, fontWeight:'700', color:theme.text },
  overBadge:     { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:theme.expenseDim, borderRadius:8, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:`${theme.expense}33` },
  overText:      { fontSize:10, color:theme.expense, fontWeight:'700' },
  budgetPeriod:  { fontSize:12, color:theme.muted, marginTop:2 },
  budgetActions: { flexDirection:'row', gap:8 },
  actBtn:        { padding:6 },
  barBg:         { height:8, backgroundColor:theme.border, borderRadius:4, overflow:'hidden', marginBottom:10 },
  barFill:       { height:'100%', borderRadius:4 },
  amtRow:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  spent:         { fontSize:13, color:theme.subtext },
  pctText:       { fontSize:13, fontWeight:'700', color:theme.text },
  remaining:     { fontSize:13, fontWeight:'700' },
  limitLabel:    { fontSize:11, color:theme.muted, marginTop:4 },
  // Form
  overlay:       { ...StyleSheet.absoluteFillObject, justifyContent:'flex-end', zIndex:99 },
  backdrop:      { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.65)' },
  sheet:         { backgroundColor:theme.card, borderTopLeftRadius:28, borderTopRightRadius:28, padding:20, paddingBottom:Platform.OS==='ios'?40:28, borderWidth:1, borderColor:theme.border },
  sheetHandle:   { width:40, height:4, backgroundColor:theme.border, borderRadius:2, alignSelf:'center', marginBottom:14 },
  sheetTitle:    { fontSize:18, fontWeight:'700', color:theme.text, marginBottom:16 },
  label:         { fontSize:10, color:theme.muted, fontWeight:'700', letterSpacing:1, marginBottom:6, textTransform:'uppercase' },
  catPill:       { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:8, borderRadius:20, borderWidth:1, borderColor:theme.border, marginRight:8, backgroundColor:theme.surface },
  catPillText:   { fontSize:12, fontWeight:'600', color:theme.muted },
  inputWrap:     { flexDirection:'row', alignItems:'center', backgroundColor:theme.surface, borderRadius:12, paddingHorizontal:14, borderWidth:1, borderColor:theme.border, marginBottom:14 },
  inputPrefix:   { fontSize:20, color:theme.subtext, marginRight:6 },
  amtInput:      { flex:1, fontSize:28, fontWeight:'700', color:theme.text, paddingVertical:12 },
  periodRow:     { flexDirection:'row', gap:10, marginBottom:20 },
  periodBtn:     { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:12, borderRadius:12, borderWidth:1, borderColor:theme.border, backgroundColor:theme.surface },
  periodActive:  { borderColor:`${theme.income}55`, backgroundColor:theme.incomeDim },
  periodText:    { fontSize:14, fontWeight:'700', color:theme.muted },
  formBtns:      { flexDirection:'row', gap:10 },
  cancelBtn:     { flex:1, backgroundColor:theme.surface, borderRadius:14, padding:14, alignItems:'center', borderWidth:1, borderColor:theme.border },
  cancelText:    { color:theme.muted, fontWeight:'700', fontSize:15 },
  saveBtn:       { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, backgroundColor:theme.income, borderRadius:14, padding:14 },
  saveBtnText:   { color:'#111', fontWeight:'800', fontSize:15 },
});