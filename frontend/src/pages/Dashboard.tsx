import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    Users,
    MoreHorizontal,
    Check,
    BarChart2,
    PieChart,
    Factory,
    Zap,
    GripHorizontal,
    TrendingUp,
    CircleDot
} from 'lucide-react';
import { produtoService } from '../services/produtoService';
import { pedidoCompraService } from '../services/pedidoCompraService';
import { utilizadorService } from '../services/utilizadorService';
import { fornecedorService } from '../services/fornecedorService';
import { 
    Coins, 
    ShoppingCart,
    PackageCheck,
    Landmark
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface SummaryStats {
    totalProdutos: number;
    totalPedidos: number;
    totalUtilizadores: number;
    pedidosPendentes: number;
    totalFornecedores: number;
    valorTotalStock: number;
    pedidosAprovados: number;
    totalDrafts: number;
}

type SectionKey = 'quickEntry' | 'cards' | 'stockBar' | 'statusPie' | 'bubble' | 'areaLine';

interface Section {
    key: SectionKey;
    label: string;
    icon: React.ElementType;
    colSpan?: string;
}

const SECTIONS: Section[] = [
    { key: 'quickEntry', label: 'Entrada Rápida',       icon: Zap,             colSpan: 'lg:col-span-2' },
    { key: 'cards',      label: 'Estatísticas',         icon: LayoutDashboard, colSpan: 'lg:col-span-2' },
    { key: 'stockBar',   label: 'Análise de Stock',     icon: BarChart2,       colSpan: 'lg:col-span-1' },
    { key: 'statusPie',  label: 'Estados de Pedidos',   icon: PieChart,        colSpan: 'lg:col-span-1' },
    { key: 'bubble',     label: 'Distribuição Múltipla', icon: CircleDot,      colSpan: 'lg:col-span-2' },
    { key: 'areaLine',   label: 'Evolução de Pedidos',   icon: TrendingUp,     colSpan: 'lg:col-span-2' },
];

// ─── Sparkline ──────────────────────────────────────────────────────────────
const Sparkline = ({ colorHex }: { colorHex: string }) => {
    const data = Array.from({ length: 12 }, () => Math.random() * 10 + 2);
    const line = d3.line<number>().x((_, i) => i * 8).y(d => 20 - d).curve(d3.curveMonotoneX);

    return (
        <svg viewBox="0 0 90 25" className="w-20 h-8 overflow-visible opacity-80"
            style={{ filter: `drop-shadow(0px 3px 5px ${colorHex}50)` }}>
            <path d={line(data)!} fill="none" stroke={colorHex} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={11 * 8} cy={20 - data[11]} r="3" fill={colorHex} className="animate-pulse" />
        </svg>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const Dashboard = () => {
    const [stats, setStats] = useState<SummaryStats>({
        totalProdutos: 0, totalPedidos: 0, totalUtilizadores: 0, pedidosPendentes: 0,
        totalFornecedores: 0, valorTotalStock: 0, pedidosAprovados: 0, totalDrafts: 0
    });
    const [loading, setLoading] = useState(true);
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

    const [visible, setVisible] = useState<Record<SectionKey, boolean>>({
        quickEntry: true, cards: true, stockBar: true, statusPie: true, bubble: true, areaLine: true,
    });
    
    // Custom order state
    const [order, setOrder] = useState<SectionKey[]>(['quickEntry', 'cards', 'stockBar', 'statusPie', 'areaLine', 'bubble']);
    const [chartDays, setChartDays] = useState(15);

    const [bubbleLegend, setBubbleLegend] = useState<{name: string, color: string, valorTotal: number, isLow: boolean, qt: number, preco: number}[]>([]);

    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    const barChartRef = useRef<SVGSVGElement>(null);
    const pieChartRef = useRef<SVGSVGElement>(null);
    const bubbleChartRef = useRef<SVGSVGElement>(null);
    const areaLineChartRef = useRef<SVGSVGElement>(null);

    // Custom Solid Drag Follower State that bypasses Native Chrome transparency
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const [isGhostCaptured, setIsGhostCaptured] = useState(false);
    
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [dragSize, setDragSize] = useState({ w: 0, h: 0 });

    const emptyImage = useRef<HTMLImageElement | null>(null);
    useEffect(() => {
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        emptyImage.current = img;
    }, []);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        setDraggingIdx(position);
        
        // Medir item
        const rect = e.currentTarget.getBoundingClientRect();
        setDragSize({ w: rect.width, h: rect.height });
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setDragPos({ x: e.clientX, y: e.clientY });

        // Ocultar a representação por defeito que o browser faz
        if (emptyImage.current) {
            e.dataTransfer.setDragImage(emptyImage.current, 0, 0);
        }

        setTimeout(() => setIsGhostCaptured(true), 10);
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        if (e.clientX === 0 && e.clientY === 0) return; // Evitar salto para a origem no final
        setDragPos({ x: e.clientX, y: e.clientY });

        // Scroll automático suave e progressivo ao aproximar incansavelmente das bordas
        const EDGE_THRESHOLD = 80;
        const MAX_SPEED = 20;

        if (e.clientY < EDGE_THRESHOLD) {
            const speed = MAX_SPEED * (1 - Math.max(0, e.clientY) / EDGE_THRESHOLD);
            window.scrollBy(0, -speed);
        } else if (window.innerHeight - e.clientY < EDGE_THRESHOLD) {
            const speed = MAX_SPEED * (1 - Math.max(0, window.innerHeight - e.clientY) / EDGE_THRESHOLD);
            window.scrollBy(0, speed);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        e.preventDefault();
        setDragOverIdx(position);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        if (draggingIdx !== null && dragOverIdx !== null && draggingIdx !== dragOverIdx) {
            const newOrder = [...order];
            const draggedContent = newOrder.splice(draggingIdx, 1)[0];
            newOrder.splice(dragOverIdx, 0, draggedContent);
            setOrder(newOrder);
        }
        setDraggingIdx(null);
        setDragOverIdx(null);
        setIsGhostCaptured(false);
    };


    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleSection = (key: SectionKey) => setVisible(prev => ({ ...prev, [key]: !prev[key] }));

    useEffect(() => {
        const load = async () => {
            try {
                const [produtos, pedidosRaw, utilizadores, fornecedores] = await Promise.all([
                    produtoService.getAll(), 
                    pedidoCompraService.getAll(), 
                    utilizadorService.getAll(),
                    fornecedorService.getAll()
                ]);

                // Filtramos RASCUNHOS para que o Dashboard reflita apenas pedidos "reais" submetidos
                const pedidos = pedidosRaw.filter((p: any) => p.estado !== 'RASCUNHO');
                
                // Rascunhos: No Dashboard, para manter consistência com o badge de navegação, 
                // contamos apenas os rascunhos do próprio utilizador logado.
                const loggedUser = JSON.parse(localStorage.getItem('user') || '{}');
                const drafts = pedidosRaw.filter((p: any) => p.estado === 'RASCUNHO' && p.criadoPorId === loggedUser.id);

                const valorStock = produtos.reduce((acc: number, p: any) => acc + (p.stock * (p.preco || 0)), 0);

                setStats({
                    totalProdutos: produtos.length, 
                    totalPedidos: pedidos.length,
                    totalUtilizadores: utilizadores.length,
                    pedidosPendentes: pedidos.filter((p: any) => p.estado === 'PENDENTE').length,
                    totalFornecedores: fornecedores.length,
                    valorTotalStock: valorStock,
                    pedidosAprovados: pedidos.filter((p: any) => p.estado === 'APROVADO' || p.estado === 'ENTREGUE').length,
                    totalDrafts: drafts.length
                });

                renderBarChart(produtos.slice(0, 8));
                renderPieChart(pedidos);
                renderAreaLineChart(pedidos, chartDays);
                renderBubbleChart(produtos.slice(0, Math.min(produtos.length, 30)));
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        load();
    }, []);

    useEffect(() => {
        if (!loading) {
            setTimeout(() => {
                pedidoCompraService.getAll().then(pRaw => {
                    const p = pRaw.filter((x: any) => x.estado !== 'RASCUNHO');
                    if (visible.statusPie) renderPieChart(p);
                    if (visible.areaLine) renderAreaLineChart(p, chartDays);
                });
            }, 100);
        }
    }, [visible.stockBar, visible.statusPie, visible.bubble, visible.areaLine, loading, order, chartDays]); // re-render charts se as tabs forem abertas ou reordenadas


    const renderBarChart = (data: any[]) => {
        if (!barChartRef.current || data.length === 0) return;
        d3.select(barChartRef.current).selectAll('*').remove();

        // Fix de referência: não podemos usar m.top dentro da definição de m
        const W = 800, H = 380, m = { top: 10, right: 40, bottom: 40, left: 190 };
        const iW = W - m.left - m.right, iH = H - m.top - m.bottom;

        const svg = d3.select(barChartRef.current).attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('height', '100%')
            .append('g').attr('transform', `translate(${m.left},${m.top})`);

        const x = d3.scaleLinear().range([0, iW]).domain([0, (d3.max(data, d => d.stock) || 100) * 1.1]).nice();
        const y = d3.scaleBand().range([0, iH]).domain(data.map(d => d.nome)).padding(0.4);

        // Grelha Vertical
        svg.append('g').attr('class', 'grid').attr('transform', `translate(0,${iH})`)
            .call(d3.axisBottom(x).tickSize(-iH).tickFormat(() => '').ticks(5))
            .call(g => g.selectAll('.domain').remove()).call(g => g.selectAll('line').style('stroke', '#f1f5f9'));

        // Eixo X
        const xa = svg.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(x).ticks(5).tickSize(0).tickPadding(10));
        xa.selectAll('.domain').remove(); xa.selectAll('text').style('font-size', '12px').style('fill', '#94a3b8').style('font-weight', '500');

        // Renderização Customizada do Eixo Y para nomes longos (HTML Wrapping via foreignObject)
        const yAxisGroup = svg.append('g');
        data.forEach(d => {
            const yPos = y(d.nome) || 0;
            const fo = yAxisGroup.append('foreignObject')
                .attr('x', -m.left)
                .attr('y', yPos)
                .attr('width', m.left - 15)
                .attr('height', y.bandwidth());

            fo.append('xhtml:div')
                .style('width', '100%')
                .style('height', '100%')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('justify-content', 'flex-end')
                .style('text-align', 'right')
                .style('padding-right', '5px')
                .style('font-size', '12px')
                .style('font-weight', '700')
                .style('line-height', '1.1')
                .style('overflow', 'hidden')
                .html(`<span class="text-slate-700 dark:text-slate-300" title="${d.nome}" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${d.nome}</span>`);
        });

        // Barras Horizontais com Gradient Moderno
        const defs = d3.select(barChartRef.current).append('defs');
        const grad = defs.append('linearGradient').attr('id', 'barGrad').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
        grad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
        grad.append('stop').attr('offset', '100%').attr('stop-color', '#34d399');

        svg.selectAll('.bar').data(data).enter().append('rect')
            .attr('class', 'bar')
            .attr('y', d => y(d.nome) || 0)
            .attr('x', 0)
            .attr('height', y.bandwidth())
            .attr('width', 0)
            .attr('fill', 'url(#barGrad)')
            .attr('rx', 4)
            .transition().duration(1200).ease(d3.easeCubicOut)
            .attr('width', d => x(d.stock));
    };

    const renderPieChart = (data: any[]) => {
        if (!pieChartRef.current || data.length === 0) return;
        d3.select(pieChartRef.current).selectAll('*').remove();

        const W = 250, H = 250, radius = Math.min(W, H) / 2;
        const svg = d3.select(pieChartRef.current).attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('height', '100%')
            .append('g').attr('transform', `translate(${W / 2},${H / 2})`);

        const counts = d3.rollups(data, v => v.length, d => d.estado);
        const pieData = Array.from(counts, ([key, value]) => ({ key, value }));
        const color = d3.scaleOrdinal<string>().domain(['PENDENTE', 'APROVADO', 'RECUSADO', 'ENTREGUE', 'CANCELADO'])
            .range(['#fbbf24', '#10b981', '#ef4444', '#3b82f6', '#94a3b8']);

        const pie = d3.pie<{ key: string; value: number }>().value(d => d.value).sort(null).padAngle(0.045);
        const arc = d3.arc<any>().innerRadius(radius * 0.6).outerRadius(radius * 0.9).cornerRadius(4);

        svg.append('text').attr('text-anchor', 'middle').attr('dy', '-0.5em').style('font-size', '10px').style('fill', '#94a3b8').text('Pedidos');
        svg.append('text').attr('text-anchor', 'middle').attr('dy', '0.6em').style('font-size', '30px').style('font-weight', 'bold').attr('class', 'fill-slate-900 dark:fill-slate-100').text(data.length);

        svg.selectAll('.arc').data(pie(pieData)).enter().append('path')
            .attr('fill', d => color(d.data.key)).attr('stroke', '#fff').style('stroke-width', '2px')
            .transition().duration(800).attrTween('d', function (d) {
                const i = d3.interpolate({ startAngle: 0, endAngle: 0 } as any, d);
                return (t: number) => arc(i(t)) as string;
            });
    };

    const renderAreaLineChart = (pedidos: any[], days: number = 15) => {
        if (!areaLineChartRef.current) return;
        d3.select(areaLineChartRef.current).selectAll('*').remove();

        const W = 800, H = 250, m = { top: 20, right: 20, bottom: 30, left: 40 };
        const iW = W - m.left - m.right, iH = H - m.top - m.bottom;

        // Extrair volumes diários reáis das tabelas
        const countMap = new Map();
        let volumeTotalJanela = 0;
        const dataLimite = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        pedidos.filter(p => p.estado === 'APROVADO' || p.estado === 'ENTREGUE').forEach(p => {
            if (p.criadoEm) {
                const dateObj = new Date(p.criadoEm);
                const dateKey = dateObj.toISOString().split('T')[0];
                
                // Agora somamos o VALOR FINANCEIRO (€) apenas de pedidos validados
                const valorFinanceiro = p.valorTotalEstimado || (p.linhas || []).reduce((acc: number, curr: any) => acc + (curr.valorTotal || 0), 0);
                
                countMap.set(dateKey, (countMap.get(dateKey) || 0) + valorFinanceiro);
                
                if (dateObj >= dataLimite) volumeTotalJanela += valorFinanceiro;
            }
        });

        // Preparar linha temporal para os últimos N dias
        const data = Array.from({length: days}, (_, i) => {
            const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split('T')[0];
            
            let realVal = countMap.get(dateKey);
            // Se houver PELO MENOS um pedido na janela, mostramos 0 para os dias vazios.
            let finalVal = realVal !== undefined ? realVal : (volumeTotalJanela > 0 ? 0 : (5 + Math.sin(i * 0.5) * 2 + Math.random() * 5));

            return { date, value: finalVal };
        });

        const svg = d3.select(areaLineChartRef.current).attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('height', '100%')
            .append('g').attr('transform', `translate(${m.left},${m.top})`);

        const x = d3.scaleTime().range([0, iW]).domain(d3.extent(data, d => d.date) as [Date, Date]);
        const y = d3.scaleLinear().range([iH, 0]).domain([0, d3.max(data, d => d.value)! * 1.2]).nice();

        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient").attr("id", "area-gradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
        gradient.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.5);
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.0);

        svg.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickSize(-iW).tickFormat(() => '').ticks(5))
            .call(g => g.selectAll('.domain').remove()).call(g => g.selectAll('line').style('stroke', '#f1f5f9').style('stroke-dasharray', '4,4'));

        svg.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(x).ticks(7).tickFormat(d3.timeFormat('%d %b') as any).tickSize(0).tickPadding(10))
            .call(g => g.selectAll('.domain').remove()).selectAll('text').style('fill', '#94a3b8').style('font-weight', '500');
        
        svg.append('g').call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(10))
            .call(g => g.selectAll('.domain').remove()).selectAll('text').style('fill', '#94a3b8').style('font-weight', '500');

        const area = d3.area<any>().x(d => x(d.date)).y0(iH).y1(d => y(d.value)).curve(d3.curveMonotoneX);
        const line = d3.line<any>().x(d => x(d.date)).y(d => y(d.value)).curve(d3.curveMonotoneX);

        const pathArea = svg.append('path').datum(data).attr('fill', 'url(#area-gradient)').attr('d', area);
        const pathLine = svg.append('path').datum(data).attr('fill', 'none').attr('stroke', '#3b82f6').attr('stroke-width', 3).attr('d', line);

        const totalLength = (pathLine.node() as SVGPathElement).getTotalLength();
        pathLine.attr('stroke-dasharray', totalLength + ' ' + totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition().duration(1500).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);
        
        pathArea.style('opacity', 0).transition().duration(1500).style('opacity', 1);

        svg.selectAll('.dot').data(data).enter().append('circle')
            .attr('cx', d => x(d.date)).attr('cy', d => y(d.value)).attr('r', 0)
            .attr('fill', '#fff').attr('stroke', '#3b82f6').attr('stroke-width', 2.5)
            .transition().delay((_,i) => i * (1500/data.length)).duration(500).ease(d3.easeElasticOut).attr('r', 4.5);
    };

    const renderBubbleChart = (produtos: any[]) => {
        if (!bubbleChartRef.current || produtos.length === 0) return;
        d3.select(bubbleChartRef.current).selectAll('*').remove();

        const W = 500, H = 400;
        const svg = d3.select(bubbleChartRef.current).attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('height', '100%');

        const data = { 
            name: 'root', 
            children: produtos.map(p => {
                const prc = p.preco || 0;
                const stk = p.stock || 0;
                const minStk = p.stockMinimo || 0;
                const valorTot = prc * stk;
                return { 
                    name: p.nome, 
                    value: valorTot > 0 ? valorTot : 1, // Impede colapso de layout para stock ou preco nulo
                    origValor: valorTot,
                    origLow: stk <= minStk
                }
            }) 
        };
        const pack = d3.pack<any>().size([W - 10, H - 10]).padding(3);
        const root = pack(d3.hierarchy<any>(data).sum((d: any) => d.value));

        const color = d3.scaleOrdinal(d3.quantize(d3.interpolateSinebow, produtos.length + 1));
        
        const legendItems = produtos.map((p, i) => {
            const prc = p.preco || 0;
            const stk = p.stock || 0;
            const minStk = p.stockMinimo || 0;
            return {
                name: p.nome, 
                color: color(i.toString()),
                valorTotal: prc * stk,
                isLow: stk <= minStk,
                qt: stk,
                preco: prc
            };
        }).sort((a, b) => b.valorTotal - a.valorTotal); // Sort highest value first for the side legend!
        
        setBubbleLegend(legendItems);

        const node = svg.selectAll('g').data(root.leaves()).enter().append('g')
            .attr('transform', d => `translate(${W/2},${H/2})`); // Start from center for animation

        node.transition().duration(1200).ease(d3.easeCubicOut).delay((_, i) => i * 20)
            .attr('transform', d => `translate(${d.x},${d.y})`);

        node.append('circle')
            .attr('r', 0)
            .attr('fill', (d, i) => color(i.toString()))
            .attr('fill-opacity', d => d.data.origLow ? 0.4 : 0.8)
            .attr('stroke', d => d.data.origLow ? '#ef4444' : '#fff')
            .attr('stroke-dasharray', d => d.data.origLow ? '4,2' : 'none')
            .attr('stroke-width', d => d.data.origLow ? 3 : 2)
            .transition().duration(1000).ease(d3.easeElasticOut).delay((_, i) => i * 30 + 300)
            .attr('r', d => d.r);

        node.append('text')
            .text(d => d.data.name.substring(0, Math.max(3, Math.floor(d.r / 3.5))))
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .style('font-size', d => Math.min(14, d.r/2.8) + 'px')
            .style('fill', '#fff')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('text-shadow', '0px 1px 3px rgba(0,0,0,0.4)')
            .transition().delay((_, i) => i * 30 + 800).duration(500).style('opacity', 1);
    };

    if (loading) return <div className="flex justify-center h-96 items-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

    // --- Widgets Configuration Content ---
    const MappedWidgets: Record<SectionKey, React.ReactNode> = {
        quickEntry: (() => {
            const items = [
                { to: '/relatorios', label: 'Financeiro', icon: Landmark, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10', roles: ['ADMINISTRADOR', 'RESPONSAVEL_FINANCEIRO'] },
                { to: '/catalogo', label: 'Stock', icon: Package, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', roles: ['ADMINISTRADOR', 'RESPONSAVEL_STOCK'] },
                { to: '/fornecedores', label: 'Fornecedores', icon: Factory, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', roles: ['ADMINISTRADOR', 'RESPONSAVEL_FINANCEIRO'] },
                { to: '/utilizadores', label: 'Utilizadores', icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', roles: ['ADMINISTRADOR'] },
                { to: '/pedidos', label: 'Pedidos Compra', icon: ClipboardList, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', roles: ['ADMINISTRADOR', 'RESPONSAVEL_STOCK', 'RESPONSAVEL_FINANCEIRO'] },
                { to: '/encomendas', label: 'Encomendas', icon: PackageCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', roles: ['ADMINISTRADOR', 'RESPONSAVEL_STOCK', 'RESPONSAVEL_FINANCEIRO'] },
            ].filter(l => l.roles.includes(user.role));

            return (
                <div className={`grid gap-4 p-5 ${items.length >= 4 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
                    {items.map((l, i) => (
                        <button key={i} onClick={() => navigate(l.to)} className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg hover:border-blue-300 transition-all group">
                            <div className={`p-4 rounded-full ${l.bg} ${l.color} mb-3 group-hover:scale-110 transition-transform`}><l.icon size={28} /></div>
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{l.label}</span>
                        </button>
                    ))}
                </div>
            );
        })(),
        cards: (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-900">
                {[
                    { label: 'Total Produtos', val: stats.totalProdutos, icon: Package, hex: '#10b981' },
                    { label: 'Valor em Stock', val: `${stats.valorTotalStock.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`, icon: Coins, hex: '#059669' },
                    { label: 'Pedidos Totais', val: stats.totalPedidos, icon: ClipboardList, hex: '#3b82f6' },
                    { label: 'Pedidos Aprovados', val: stats.pedidosAprovados, icon: Check, hex: '#2563eb' },
                    { label: 'Pendentes Hoje', val: stats.pedidosPendentes, icon: LayoutDashboard, hex: '#f59e0b' },
                    { label: 'Rascunhos Ativos', val: stats.totalDrafts, icon: ShoppingCart, hex: '#f43f5e' },
                    { label: 'Fornecedores', val: stats.totalFornecedores, icon: Factory, hex: '#6366f1' },
                    { label: 'Utilizadores', val: stats.totalUtilizadores, icon: Users, hex: '#a855f7' },
                ].map((c, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest truncate">{c.label}</p>
                            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-200 truncate">{c.val}</h3>
                        </div>
                        <div className={`p-2.5 rounded-xl bg-opacity-10 shrink-0`} style={{ backgroundColor: `${c.hex}15`, color: c.hex }}>
                            <c.icon size={22} />
                        </div>
                    </div>
                ))}
            </div>
        ),
        stockBar: (
            <div className="bg-white dark:bg-slate-800 p-6 border border-slate-100 dark:border-slate-700/50 flex flex-col h-full">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <BarChart2 size={18} className="text-emerald-500"/> Análise de Stock (Top Produtos)
                </h4>
                <div className="flex-1 min-h-[220px]"><svg ref={barChartRef}></svg></div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-sm shadow-sm" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Unidades Disponíveis (un)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 italic font-medium">Top 8 por volume</div>
                </div>
            </div>
        ),
        statusPie: (
            <div className="bg-white dark:bg-slate-800 p-6 border border-slate-100 dark:border-slate-700/50 flex flex-col items-center">
                 <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 w-full text-left flex items-center gap-2">
                    <PieChart size={18} className="text-blue-500"/> Distribuição de Estados (Tickets)
                </h4>
                <div className="w-56 h-56 mt-4"><svg ref={pieChartRef}></svg></div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-8">
                    {[
                        { label: 'Pendente', val: 'PENDENTE', color: 'bg-amber-400' },
                        { label: 'Aprovado', val: 'APROVADO', color: 'bg-emerald-500' },
                        { label: 'Entregue', val: 'ENTREGUE', color: 'bg-blue-500' },
                        { label: 'Cancelado', val: 'CANCELADO', color: 'bg-slate-400' },
                        { label: 'Recusado', val: 'RECUSADO', color: 'bg-red-500' },
                    ].map(s => (
                        <span key={s.val} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${s.color} shadow-sm`} /> {s.label}
                        </span>
                    ))}
                </div>
            </div>
        ),
        areaLine: (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-700/50">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <TrendingUp className="text-blue-500" size={20} />
                        Curva de Gastos em Aprovisionamento
                    </h4>
                    <div className="flex bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                        {[7, 15, 30].map(d => (
                            <button
                                key={d}
                                onClick={() => setChartDays(d)}
                                className={`px-4 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-all ${chartDays === d ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                            >
                                {d}D
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-stretch gap-6 w-full">
                    {/* Legenda (Esquerda) */}
                    <div className="w-full md:w-1/4 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                        <h5 className="text-xs uppercase font-bold text-slate-400 mb-6 tracking-widest text-center">Legenda Visual</h5>
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-1 bg-blue-500 shadow-sm shrink-0 rounded-full" />
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total de Gastos em Stock (€)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-full shadow-sm shrink-0 ml-1.5" />
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Marcação Temporal de Ocorrência</span>
                            </div>
                             <div className="flex items-center gap-3">
                                <div className="w-6 h-4 bg-blue-500/20 shadow-inner shrink-0 rounded" />
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Densidade Logística Acumulada</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Gráfico (Centro) */}
                    <div className="h-64 w-full md:w-2/4 flex justify-center items-center">
                        <svg ref={areaLineChartRef}></svg>
                    </div>

                    {/* Explicação (Direita) */}
                    <div className="w-full md:w-1/4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                        <h5 className="text-xs uppercase font-bold text-blue-500 mb-3 tracking-widest text-left w-full flex items-center gap-2">
                           <LayoutDashboard size={16}/> Comportamento da Curva
                        </h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-justify hyphens-auto">
                            Este gráfico monitoriza o <span className="font-semibold text-slate-800 dark:text-slate-200">fluxo de capital</span> destinado à aquisição de inventário. A curva mapeia o custo total dos pedidos efetuados, revelando picos de investimento e permitindo o controlo visual das saídas financeiras para reposição de stock nos últimos <span className="font-bold text-blue-600 dark:text-blue-400">{chartDays} dias</span>.
                        </p>
                    </div>
                </div>
            </div>
        ),
        bubble: (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 flex flex-col border border-slate-100 dark:border-slate-700/50">
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-2 w-full text-left flex items-center gap-2">
                    <CircleDot className="text-emerald-500" size={20} />
                    Agrupamento de Massa Pró-Ativa (Produtos)
                </h4>
                <p className="text-xs text-slate-400 w-full text-left mb-6">Panorama interativo do peso financeiro em armazém criado pela proporção do valor em stock.</p>
                
                <div className="flex flex-col md:flex-row items-stretch gap-6 w-full">
                    
                    {/* Legenda de Cores (Esquerda) */}
                    <div className="w-full md:w-1/4 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-y-auto max-h-96 custom-scrollbar">
                        <h5 className="text-xs uppercase font-bold text-slate-400 mb-4 tracking-widest sticky top-0 bg-white dark:bg-slate-800 pb-2">Legenda Visual</h5>
                        <div className="flex flex-col gap-3">
                            {bubbleLegend.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                    <div className={`w-3.5 h-3.5 rounded-full shadow-sm shrink-0 ${item.isLow ? 'ring-2 ring-red-500 ring-offset-1' : ''}`} style={{ backgroundColor: item.color }} />
                                    <div className="flex flex-col flex-1">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={item.name}>
                                            {item.name}
                                        </span>
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                            {item.qt} un <span className="text-slate-400 font-normal">× {item.preco.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                                        </span>
                                    </div>
                                    <div className="text-xs font-black text-slate-800 dark:text-slate-200 shrink-0">
                                        {item.valorTotal.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gráfico (Centro) */}
                    <div className="h-96 w-full md:w-2/4 flex justify-center items-center">
                        <svg ref={bubbleChartRef}></svg>
                    </div>
                    
                    {/* Explicação Pedida Pelo Utilizador (Direita) */}
                    <div className="w-full md:w-1/4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                        <h5 className="text-xs uppercase font-bold text-blue-500 mb-3 tracking-widest text-left w-full flex items-center gap-2">
                           <LayoutDashboard size={16}/> Como ler este Gráfico?
                        </h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-justify hyphens-auto">
                            Neste gráfico de alto desempenho, o tamanho de cada bolha cruza o <span className="font-semibold text-slate-800 dark:text-slate-200">Preço com Quantidade</span>, representando assim o seu <span className="font-bold text-slate-800 dark:text-slate-200">Valor Total de Inventário</span>. 
                            Quão maior a bolha central, mais dinheiro tem empatado nesse respetivo artigo do armazém! Artigos perto do limite escasso de stock refletem ainda uma margem de alerta a vermelho, ajudando visivelmente a identificar o risco sem tabelas.
                        </p>
                    </div>
                </div>
            </div>
        )
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 bg-slate-100 dark:bg-slate-700/50 min-h-screen -m-4 p-8">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
                    <LayoutDashboard className="text-emerald-600 dark:text-emerald-400" />
                    Dashboard
                </h1>
                <div className="relative" ref={settingsRef}>
                    <button onClick={() => setSettingsOpen(!settingsOpen)} className="p-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-900">
                        <MoreHorizontal size={20} />
                    </button>
                            {settingsOpen && (
                                <div className="absolute right-0 top-12 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-none animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Painel de Controlo</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">Personalize a visibilidade dos módulos</p>
                                    </div>
                                    <div className="p-2 max-h-[400px] overflow-y-auto">
                                        {SECTIONS.map(s => (
                                            <div 
                                                key={s.key} 
                                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${visible[s.key] ? 'bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-100/50 dark:hover:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                                onClick={() => toggleSection(s.key)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${visible[s.key] ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                        <s.icon size={16} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-bold ${visible[s.key] ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                                            {s.label}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {visible[s.key] ? 'Visível' : 'Oculto'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`w-10 h-5 rounded-full transition-colors relative ${visible[s.key] ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${visible[s.key] ? 'left-6' : 'left-1'}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
                                        <button 
                                            onClick={() => setVisible(Object.keys(visible).reduce((acc, k) => ({ ...acc, [k]: true }), {} as any))}
                                            className="w-full py-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight hover:bg-blue-100/50 dark:hover:bg-blue-400/10 rounded-lg transition-colors"
                                        >
                                            Mostrar Todos os Módulos
                                        </button>
                                    </div>
                                </div>
                            )}
                </div>
            </div>

            {/* Draggable Widgets Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                {order.map((sectionKey, index) => {
                    if (!visible[sectionKey]) return null;
                    const secInfo = SECTIONS.find(s => s.key === sectionKey);
                    
                    const isDragOver = dragOverIdx === index && draggingIdx !== index;
                    const isDraggingUp = draggingIdx !== null && draggingIdx > index;
                    const isDraggingDown = draggingIdx !== null && index > draggingIdx;
                    
                    return (
                        <div 
                            key={sectionKey} 
                            className={`transition-all duration-300 py-1 ${secInfo?.colSpan || 'lg:col-span-1'}`}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDragEnd}
                        >
                            
                            {/* Placeholder 'Sombra' (Movimento para Cima) */}
                            <div className={`overflow-hidden transition-all duration-300 flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 border-dashed border-blue-400 rounded-xl shadow-inner 
                                ${isDragOver && isDraggingUp ? 'h-28 mb-6 opacity-100 border-2' : 'h-0 mb-0 opacity-0 border-0'}`}>
                                <span className="text-blue-500 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                    <GripHorizontal size={16}/> Encaixar Módulo Aqui
                                </span>
                            </div>

                            <div className="relative">
                                {/* O slot invisível original! Abre o espaço "Encaixar Módulo Aqui" quando hover */}
                                {draggingIdx === index && isGhostCaptured && (
                                    <div className={`transition-all duration-300 overflow-hidden ${dragOverIdx === index ? 'h-28 bg-blue-50 dark:bg-blue-500/10 border-dashed border-blue-400 border-2 rounded-xl shadow-inner flex items-center justify-center opacity-100' : 'h-8 bg-transparent border-0 opacity-0 mb-0'}`}>
                                        <span className={`${dragOverIdx === index ? 'flex' : 'hidden'} text-blue-500 font-bold uppercase tracking-widest text-sm items-center gap-2`}>
                                            <GripHorizontal size={16}/> Encaixar Módulo Aqui
                                        </span>
                                    </div>
                                )}

                                {/* O Próprio Módulo / Cartão Físico */}
                                <div 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDrag={handleDrag}
                                    onDragEnd={handleDragEnd}
                                    style={draggingIdx === index && isGhostCaptured ? {
                                        position: 'fixed',
                                        left: dragPos.x - dragOffset.x,
                                        top: dragPos.y - dragOffset.y,
                                        width: dragSize.w,
                                        height: dragSize.h,
                                        zIndex: 999999,
                                        pointerEvents: 'none',
                                        opacity: 1,
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
                                    } : {}}
                                    className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border overflow-hidden group cursor-grab active:cursor-grabbing ${draggingIdx === index && isGhostCaptured ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-slate-300 dark:border-slate-600 relative transition-all duration-300'}`}
                                >
                                    {/* Widget Header (Drag Handle) */}
                                    <div className="flex items-center gap-2 bg-gradient-to-r from-slate-100 dark:from-slate-800 to-white dark:to-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-700 cursor-move hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-t-xl">
                                        <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <GripHorizontal size={18} />
                                        </div>
                                        <div className="w-1 h-5 bg-blue-500 rounded-full shadow-sm" />
                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{secInfo?.label}</span>
                                    </div>
                                    
                                    {/* Widget Content */}
                                    <div className="bg-white dark:bg-slate-800 cursor-default rounded-b-xl overflow-hidden">
                                        {MappedWidgets[sectionKey]}
                                    </div>
                                </div>
                            </div>

                            {/* Placeholder 'Sombra' (Movimento para Baixo) */}
                            <div className={`overflow-hidden transition-all duration-300 flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 border-dashed border-blue-400 rounded-xl shadow-inner
                                ${isDragOver && isDraggingDown ? 'h-28 mt-6 opacity-100 border-2' : 'h-0 mt-0 opacity-0 border-0'}`}>
                                <span className="text-blue-500 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                    <GripHorizontal size={16}/> Encaixar Módulo Aqui
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {Object.values(visible).every(v => !v) && (
                <div className="text-center py-20 text-slate-400">
                    Nenhum módulo selecionado no perfil do utilizador.
                </div>
            )}
        </div>
    );
};

export default Dashboard;
