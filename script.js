let DB = { items: [], movs: [] };
const CFG_KEY = 'eb_cfg_stock';

// Funções de Nuvem (O que faltava!)
async function cloudRead(key, bin) {
    const r = await fetch(`https://api.jsonbin.io/v3/b/${bin}/latest`, {
        headers: { 'X-Master-Key': key }
    });
    const data = await r.json();
    return data.record;
}

async function cloudWrite(key, bin, data) {
    await fetch(`https://api.jsonbin.io/v3/b/${bin}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Master-Key': key },
        body: JSON.stringify(data)
    });
}

// Inicialização
async function init() {
    const cfg = JSON.parse(localStorage.getItem(CFG_KEY));
    if (cfg && cfg.apiKey && cfg.binId) {
        try {
            DB = await cloudRead(cfg.apiKey, cfg.binId);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('app-interface').style.display = 'flex';
            render();
        } catch (e) {
            alert("Erro ao conectar. Verifique sua chave.");
            reconfig();
        }
    } else {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'flex';
    }
}

// Renderizar Tabelas
function render() {
    const tbodyEstoque = document.getElementById('tbody-estoque');
    tbodyEstoque.innerHTML = DB.items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.nome}</td>
            <td>${item.unidade}</td>
            <td>${item.qtd}</td>
            <td><button onclick="deleteItem(${item.id})">🗑️</button></td>
        </tr>
    `).join('');

    const tbodyMovs = document.getElementById('tbody-movs');
    tbodyMovs.innerHTML = DB.movs.map(m => `
        <tr>
            <td>${new Date(m.data).toLocaleDateString()}</td>
            <td>${m.itemNome}</td>
            <td>${m.tipo}</td>
            <td>${m.qtd}</td>
            <td>${m.unidade}</td>
        </tr>
    `).reverse().join('');

    // Atualiza o select de itens na movimentação
    const select = document.getElementById('mov-item-select');
    select.innerHTML = DB.items.map(i => `<option value="${i.id}">${i.nome}</option>`).join('');
}

// Salvar Novo Item
async function saveItem() {
    const nome = document.getElementById('item-nome').value;
    const unidade = document.getElementById('item-unidade').value;
    const cfg = JSON.parse(localStorage.getItem(CFG_KEY));

    if (!nome) return alert("Nome vazio!");

    const novo = { id: Date.now(), nome, unidade, qtd: 0 };
    DB.items.push(novo);

    await cloudWrite(cfg.apiKey, cfg.binId, DB);
    closeModal('modal-item');
    render();
}

// Salvar Movimentação
async function saveMov() {
    const itemId = document.getElementById('mov-item-select').value;
    const qtd = parseFloat(document.getElementById('mov-qtd').value);
    const tipo = document.getElementById('mov-tipo').value;
    const cfg = JSON.parse(localStorage.getItem(CFG_KEY));

    const item = DB.items.find(i => i.id == itemId);
    if (tipo === 'saida') item.qtd -= qtd;
    else item.qtd += qtd;

    DB.movs.push({ data: new Date(), itemNome: item.nome, tipo, qtd, unidade: item.unidade });

    await cloudWrite(cfg.apiKey, cfg.binId, DB);
    closeModal('modal-mov');
    render();
}

// Outras funções auxiliares
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    document.getElementById('tab-' + t).classList.add('active');
}
function reconfig() { localStorage.removeItem(CFG_KEY); location.reload(); }
function saveConfig() {
    const apiKey = document.getElementById('api-key').value;
    const binId = document.getElementById('bin-id').value;
    localStorage.setItem(CFG_KEY, JSON.stringify({ apiKey, binId }));
    location.reload();
}

init();