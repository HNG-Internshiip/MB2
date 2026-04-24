import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { loadTransactions, loadCurrency, Transaction } from '@/lib/storage';
import { fmt, last7DaysSpend, spendByCategory, last6MonthsFlow, totalIncome, totalExpense } from '@/lib/finance';
import { getCat } from '@/constants/categories';
import theme from '@/constants/theme';

const { width } = Dimensions.get('window');
const CHART_W = width - 32;
const BAR_H   = 160;

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function BarChart({ data, color }: { data: { label:string; value:number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={bc.wrap}>
      {data.map((d, i) => (
        <View key={i} style={bc.col}>
          <View style={bc.barWrap}>
            <View style={[bc.bar, { height: (d.value / max) * BAR_H, backgroundColor: d.value > 0 ? color : theme.border }]} />
          </View>
          <Text style={bc.label}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}
const bc = StyleSheet.create({
  wrap:   { flexDirection:'row', alignItems:'flex-end', height:BAR_H+28, gap:4 },
  col:    { flex:1, alignItems:'center' },
  barWrap:{ height:BAR_H, justifyContent:'flex-end', width:'100%', alignItems:'center' },
  bar:    { width:'70%', borderRadius:6, minHeight:3 },
  label:  { fontSize:10, color:theme.muted, marginTop:5 },
});

// ─── Grouped bar (income vs expense) ─────────────────────────────────────────
function GroupedBar({ data }: { data: { month:string; income:number; expense:number }[] }) {
  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  return (
    <View style={gb.wrap}>
      {data.map((d, i) => (
        <View key={i} style={gb.col}>
          <View style={gb.bars}>
            <View style={[gb.inc, { height:(d.income/max)*(BAR_H-20) }]} />
            <View style={[gb.exp, { height:(d.expense/max)*(BAR_H-20) }]} />
          </View>
          <Text style={gb.label}>{d.month}</Text>
        </View>
      ))}
    </View>
  );
}
const gb = StyleSheet.create({
  wrap:  { flexDirection:'row', alignItems:'flex-end', height:BAR_H+24, gap:6 },
  col:   { flex:1, alignItems:'center' },
  bars:  { flexDirection:'row', alignItems:'flex-end', height:BAR_H-20, gap:2, width:'100%', justifyContent:'center' },
  inc:   { flex:1, backgroundColor:theme.income, borderRadius:4, minHeight:2 },
  exp:   { flex:1, backgroundColor:theme.expense, borderRadius:4, minHeight:2 },
  label: { fontSize:10, color:theme.muted, marginTop:5 },
});

// ─── Donut chart (CSS-style via View) ─────────────────────────────────────────
function DonutChart({ segments }: { segments: { value:number; color:string; label:string }[] }) {
  const total = segments.reduce((s, sg) => s + sg.value, 0) || 1;
  let cumulative = 0;
  const SIZE = 160;

  return (
    <View style={d.wrap}>
      {/* Stacked ring using border trick */}
      <View style={[d.ring, { width:SIZE, height:SIZE, borderRadius:SIZE/2 }]}>
        {segments.map((sg, i) => {
          const pct = sg.value / total;
          return (
            <View key={i} style={[d.segment, {
              backgroundColor: sg.color,
              width: SIZE * pct * 0.9,
              opacity: 0.85,
            }]} />
          );
        })}
        <View style={d.hole}>
          <Text style={d.holeText}>{segments.length}</Text>
          <Text style={d.holeSub}>cats</Text>
        </View>
      </View>
      {/* Legend */}
      <View style={d.legend}>
        {segments.slice(0,6).map((sg,i) => (
          <View key={i} style={d.legendItem}>
            <View style={[d.dot, { backgroundColor:sg.color }]} />
            <Text style={d.legendText} numberOfLines={1}>{sg.label}</Text>
            <Text style={d.legendPct}>{Math.round((sg.value/total)*100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const d = StyleSheet.create({
  wrap:       { alignItems:'center', gap:20 },
  ring:       { alignItems:'center', justifyContent:'center', overflow:'hidden', backgroundColor:theme.surface, flexDirection:'row', flexWrap:'wrap' },
  segment:    { height:'100%' },
  hole:       { position:'absolute', width:80, height:80, borderRadius:40, backgroundColor:theme.card, alignItems:'center', justifyContent:'center' },
  holeText:   { fontSize:22, fontWeight:'800', color:theme.text },
  holeSub:    { fontSize:11, color:theme.muted },
  legend:     { width:'100%', gap:8 },
  legendItem: { flexDirection:'row', alignItems:'center', gap:8 },
  dot:        { width:10, height:10, borderRadius:5 },
  legendText: { flex:1, fontSize:13, color:theme.subtext },
  legendPct:  { fontSize:12, fontWeight:'700', color:theme.text },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Analytics() {
  const [txs, setTxs]         = useState<Transaction[]>([]);
  const [currency, setCurrency]= useState('USD');

  useFocusEffect(useCallback(() => {
    (async () => {
      const [t, c] = await Promise.all([loadTransactions(), loadCurrency()]);
      setTxs(t); setCurrency(c);
    })();
  }, []));

  const daily    = last7DaysSpend(txs);
  const catSpend = spendByCategory(txs);
  const monthly  = last6MonthsFlow(txs);
  const inc      = totalIncome(txs);
  const exp      = totalExpense(txs);
  const savRate  = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;

  const catSegments = Object.entries(catSpend)
    .filter(([, v]) => v > 0)
    .sort(([,a],[,b]) => b - a)
    .map(([id, value]) => {
      const c = getCat(id as any);
      return { value, color:c.color, label:c.label };
    });

  return (
    <SafeAreaView style={s.safe} edges={['top','left','right']}>
      <View style={s.header}>
        <Text style={s.title}>Analytics</Text>
        <Text style={s.sub}>Financial overview</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding:16, paddingBottom:40 }}>

        {/* ── KPI row ── */}
        <View style={s.kpiRow}>
          {[
            { label:'Total In',   val:fmt(inc, currency), color:theme.income,  icon:'arrow-down-circle'  },
            { label:'Total Out',  val:fmt(exp, currency), color:theme.expense, icon:'arrow-up-circle'    },
            { label:'Save Rate',  val:`${savRate}%`,      color:theme.blue,    icon:'trending-up'        },
          ].map((k, i) => (
            <View key={i} style={s.kpiCard}>
              <Ionicons name={k.icon as any} size={20} color={k.color} style={{ marginBottom:6 }} />
              <Text style={[s.kpiVal, { color:k.color }]}>{k.val}</Text>
              <Text style={s.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* ── 7-day spending ── */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Daily Spending — Last 7 Days</Text>
          <Text style={s.chartSub}>Total expenses per day</Text>
          {daily.every(d => d.value === 0) ? (
            <View style={s.noData}><Ionicons name="bar-chart-outline" size={36} color={theme.border}/><Text style={s.noDataText}>No spending data</Text></View>
          ) : (
            <BarChart data={daily} color={theme.expense} />
          )}
        </View>

        {/* ── Income vs Expense ── */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Income vs Expenses — 6 Months</Text>
          <View style={s.legend}>
            <View style={s.legendItem}><View style={[s.legendDot,{backgroundColor:theme.income}]}/><Text style={s.legendText}>Income</Text></View>
            <View style={s.legendItem}><View style={[s.legendDot,{backgroundColor:theme.expense}]}/><Text style={s.legendText}>Expenses</Text></View>
          </View>
          {monthly.every(m => m.income === 0 && m.expense === 0) ? (
            <View style={s.noData}><Ionicons name="bar-chart-outline" size={36} color={theme.border}/><Text style={s.noDataText}>No data yet</Text></View>
          ) : (
            <GroupedBar data={monthly} />
          )}
        </View>

        {/* ── Category breakdown ── */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Spending by Category</Text>
          <Text style={s.chartSub}>This month</Text>
          {catSegments.length === 0 ? (
            <View style={s.noData}><Ionicons name="pie-chart-outline" size={36} color={theme.border}/><Text style={s.noDataText}>No expense data</Text></View>
          ) : (
            <>
              <DonutChart segments={catSegments} />
              <View style={{ marginTop:16, gap:8 }}>
                {catSegments.slice(0,5).map((sg,i) => (
                  <View key={i} style={s.catRow}>
                    <View style={[s.catDot,{backgroundColor:sg.color}]}/>
                    <Text style={s.catName}>{sg.label}</Text>
                    <View style={s.catBar}>
                      <View style={[s.catFill,{width:`${(sg.value/catSegments[0].value)*100}%`,backgroundColor:sg.color}]}/>
                    </View>
                    <Text style={s.catAmt}>{fmt(sg.value, currency)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex:1, backgroundColor:theme.bg },
  header:      { paddingHorizontal:20, paddingTop:16, paddingBottom:10, borderBottomWidth:1, borderBottomColor:theme.border },
  title:       { fontSize:26, fontWeight:'800', color:theme.text },
  sub:         { fontSize:12, color:theme.muted, marginTop:2 },
  kpiRow:      { flexDirection:'row', gap:10, marginBottom:16 },
  kpiCard:     { flex:1, backgroundColor:theme.card, borderRadius:16, padding:14, alignItems:'center', borderWidth:1, borderColor:theme.border },
  kpiVal:      { fontSize:16, fontWeight:'800', marginBottom:2 },
  kpiLabel:    { fontSize:10, color:theme.muted, fontWeight:'600' },
  chartCard:   { backgroundColor:theme.card, borderRadius:20, padding:18, marginBottom:16, borderWidth:1, borderColor:theme.border },
  chartTitle:  { fontSize:15, fontWeight:'700', color:theme.text, marginBottom:3 },
  chartSub:    { fontSize:11, color:theme.muted, marginBottom:14 },
  legend:      { flexDirection:'row', gap:16, marginBottom:12 },
  legendItem:  { flexDirection:'row', alignItems:'center', gap:6 },
  legendDot:   { width:10, height:10, borderRadius:5 },
  legendText:  { fontSize:12, color:theme.subtext },
  noData:      { alignItems:'center', paddingVertical:24, gap:8 },
  noDataText:  { color:theme.muted, fontSize:13 },
  catRow:      { flexDirection:'row', alignItems:'center', gap:8 },
  catDot:      { width:10, height:10, borderRadius:5 },
  catName:     { fontSize:12, color:theme.subtext, width:90 },
  catBar:      { flex:1, height:6, backgroundColor:theme.border, borderRadius:3, overflow:'hidden' },
  catFill:     { height:'100%', borderRadius:3 },
  catAmt:      { fontSize:12, fontWeight:'600', color:theme.text, width:60, textAlign:'right' },
});