import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { loadTransactions, loadBudgets, loadCurrency, Transaction, Budget } from '@/lib/storage';
import { fmt, balance, totalIncome, totalExpense, thisMonth, budgetSpent, CURRENCIES } from '@/lib/finance';
import { getCat } from '@/constants/categories';
import theme from '@/constants/theme';

export default function Dashboard() {
  const [txs, setTxs]         = useState<Transaction[]>([]);
  const [budgets, setBudgets]  = useState<Budget[]>([]);
  const [currency, setCurrency]= useState('USD');
  const [refreshing, setRef]   = useState(false);
  const [hideBalance, setHide] = useState(false);

  const load = useCallback(async () => {
    const [t, b, c] = await Promise.all([loadTransactions(), loadBudgets(), loadCurrency()]);
    setTxs(t); setBudgets(b); setCurrency(c);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const refresh = async () => { setRef(true); await load(); setRef(false); };

  const monthly   = thisMonth(txs);
  const bal       = balance(txs);
  const inc       = totalIncome(monthly);
  const exp       = totalExpense(monthly);
  const recent    = [...txs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const sym       = CURRENCIES[currency]?.symbol ?? currency;

  return (
    <SafeAreaView style={s.safe} edges={['top','left','right']}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.gold} />}
        contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerGreet}>My Finance</Text>
            <Text style={s.headerSub}>{new Date().toLocaleDateString('en', { month:'long', year:'numeric' })}</Text>
          </View>
          <TouchableOpacity style={s.currencyBadge} onPress={() => router.push('/(tabs)/budget')}>
            <Text style={s.currencyText}>{sym}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Balance hero ── */}
        <View style={s.balanceCard}>
          <View style={s.balanceTopRow}>
            <Text style={s.balanceLabel}>Total Balance</Text>
            <TouchableOpacity onPress={() => setHide(h => !h)}>
              <Ionicons name={hideBalance ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.muted} />
            </TouchableOpacity>
          </View>
          <Text style={[s.balanceAmount, { color: bal >= 0 ? theme.income : theme.expense }]}>
            {hideBalance ? '••••••' : fmt(bal, currency)}
          </Text>
          <Text style={s.balanceSub}>Overall balance across all time</Text>

          <View style={s.incExpRow}>
            <View style={s.incExpItem}>
              <View style={[s.incExpIcon, { backgroundColor: theme.incomeDim }]}>
                <Ionicons name="arrow-down" size={16} color={theme.income} />
              </View>
              <View>
                <Text style={s.incExpLabel}>Income</Text>
                <Text style={[s.incExpAmount, { color: theme.income }]}>
                  {hideBalance ? '••••' : fmt(inc, currency)}
                </Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.incExpItem}>
              <View style={[s.incExpIcon, { backgroundColor: theme.expenseDim }]}>
                <Ionicons name="arrow-up" size={16} color={theme.expense} />
              </View>
              <View>
                <Text style={s.incExpLabel}>Expenses</Text>
                <Text style={[s.incExpAmount, { color: theme.expense }]}>
                  {hideBalance ? '••••' : fmt(exp, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Budget alerts ── */}
        {budgets.length > 0 && (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Budget Status</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/budget')}>
                <Text style={s.sectionLink}>Manage</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
              {budgets.map(b => {
                const spent  = budgetSpent(b, txs);
                const pct    = Math.min(spent / b.limit, 1);
                const cat    = getCat(b.category);
                const over   = spent > b.limit;
                const barClr = pct > 0.85 ? theme.expense : pct > 0.6 ? theme.gold : theme.income;
                return (
                  <View key={b.id} style={s.budgetCard}>
                    <View style={s.budgetTop}>
                      <View style={[s.budgetIcon, { backgroundColor: `${cat.color}22` }]}>
                        <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.budgetCat}>{cat.label}</Text>
                        <Text style={s.budgetPeriod}>{b.period}</Text>
                      </View>
                      {over && <Ionicons name="warning" size={16} color={theme.expense} />}
                    </View>
                    <View style={s.budgetBar}>
                      <View style={[s.budgetFill, { width: `${pct * 100}%`, backgroundColor: barClr }]} />
                    </View>
                    <Text style={[s.budgetAmt, { color: over ? theme.expense : theme.subtext }]}>
                      {fmt(spent, currency)} / {fmt(b.limit, currency)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Recent transactions ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={s.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="receipt-outline" size={44} color={theme.border} />
            <Text style={s.emptyText}>No transactions yet</Text>
            <TouchableOpacity style={s.addFirstBtn} onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={s.addFirstText}>Add your first transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.txList}>
            {recent.map(tx => {
              const cat = getCat(tx.category);
              return (
                <View key={tx.id} style={s.txRow}>
                  <View style={[s.txIcon, { backgroundColor: `${cat.color}22` }]}>
                    <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txNote} numberOfLines={1}>{tx.note || cat.label}</Text>
                    <Text style={s.txMeta}>
                      {cat.label} · {new Date(tx.date).toLocaleDateString('en', { month:'short', day:'numeric' })}
                      {tx.recurring ? ' 🔁' : ''}
                    </Text>
                  </View>
                  <Text style={[s.txAmt, { color: tx.type === 'income' ? theme.income : theme.expense }]}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, currency)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex:1, backgroundColor:theme.bg },
  header:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingTop:14, paddingBottom:10 },
  headerGreet:    { fontSize:22, fontWeight:'800', color:theme.text },
  headerSub:      { fontSize:12, color:theme.muted, marginTop:2 },
  currencyBadge:  { backgroundColor:theme.goldDim, borderRadius:12, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:`${theme.gold}33` },
  currencyText:   { color:theme.gold, fontWeight:'700', fontSize:15 },
  // Balance card
  balanceCard:    { margin:16, backgroundColor:theme.card, borderRadius:24, padding:22, borderWidth:1, borderColor:theme.border },
  balanceTopRow:  { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  balanceLabel:   { fontSize:12, color:theme.muted, fontWeight:'600', letterSpacing:0.5 },
  balanceAmount:  { fontSize:44, fontWeight:'900', letterSpacing:-1 },
  balanceSub:     { fontSize:11, color:theme.muted, marginBottom:20, marginTop:2 },
  incExpRow:      { flexDirection:'row', alignItems:'center' },
  incExpItem:     { flex:1, flexDirection:'row', alignItems:'center', gap:10 },
  incExpIcon:     { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  incExpLabel:    { fontSize:11, color:theme.muted },
  incExpAmount:   { fontSize:16, fontWeight:'700', marginTop:1 },
  divider:        { width:1, height:40, backgroundColor:theme.border, marginHorizontal:12 },
  // Budget
  sectionRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, marginTop:20, marginBottom:12 },
  sectionTitle:   { fontSize:17, fontWeight:'700', color:theme.text },
  sectionLink:    { fontSize:13, color:theme.gold, fontWeight:'600' },
  budgetCard:     { backgroundColor:theme.card, borderRadius:18, padding:16, marginRight:12, width:180, borderWidth:1, borderColor:theme.border },
  budgetTop:      { flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 },
  budgetIcon:     { width:34, height:34, borderRadius:10, alignItems:'center', justifyContent:'center' },
  budgetCat:      { fontSize:13, fontWeight:'700', color:theme.text },
  budgetPeriod:   { fontSize:11, color:theme.muted },
  budgetBar:      { height:6, backgroundColor:theme.border, borderRadius:3, overflow:'hidden', marginBottom:6 },
  budgetFill:     { height:'100%', borderRadius:3 },
  budgetAmt:      { fontSize:12, fontWeight:'600' },
  // Transactions
  emptyBox:       { alignItems:'center', paddingVertical:40, gap:10 },
  emptyText:      { color:theme.muted, fontSize:14 },
  addFirstBtn:    { backgroundColor:theme.goldDim, borderRadius:10, paddingHorizontal:16, paddingVertical:8, borderWidth:1, borderColor:`${theme.gold}33` },
  addFirstText:   { color:theme.gold, fontWeight:'600', fontSize:13 },
  txList:         { paddingHorizontal:16, gap:2 },
  txRow:          { flexDirection:'row', alignItems:'center', backgroundColor:theme.card, borderRadius:14, padding:14, marginBottom:8, gap:12, borderWidth:1, borderColor:theme.border },
  txIcon:         { width:42, height:42, borderRadius:12, alignItems:'center', justifyContent:'center' },
  txNote:         { fontSize:14, fontWeight:'600', color:theme.text },
  txMeta:         { fontSize:11, color:theme.muted, marginTop:2 },
  txAmt:          { fontSize:15, fontWeight:'700' },
});