// --- ARQUIVO: src/pages/retail/pos/UploadPOS.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript ---
// Este componente de React permite que o usuário faça o upload de um arquivo de planilha
// (Excel ou CSV) para registrar várias vendas de uma só vez, com uma interface de arrastar e soltar.

import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '/src/hooks/useAuth.js';
import { getInventoryByRetailer } from '/src/state/selectors.js';
import { setItem, getItem } from '/src/state/storage.js';
import { generateId } from '/src/utils/ids.js';
import { Container, Button, Alert, Table } from 'react-bootstrap';
import * as XLSX from 'xlsx';

const UploadPOS = () => {
    const { user } = useAuth();
    const [parsedData, setParsedData] = useState([]);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId) : [], [user]);

    const resetState = () => {
        setError('');
        setParsedData([]);
        setFileName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        // Mantém a mensagem de sucesso por um tempo para o usuário ver
        setTimeout(() => setSuccess(''), 5000);
    };

    const processFile = (file) => {
        if (!file) return;

        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!validExtensions.includes(fileExtension)) {
            setError('Formato de arquivo inválido. Por favor, envie um arquivo .csv, .xls ou .xlsx.');
            return;
        }

        resetState();
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                processSheetData(data);
            } catch (e) {
                console.error("Erro ao processar o arquivo:", e);
                setError("Ocorreu um erro ao ler o arquivo. Verifique se ele não está corrompido.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    const processSheetData = (data) => {
        if (!data || data.length < 2) {
            setError('A planilha parece estar vazia ou contém apenas o cabeçalho.');
            return;
        }
        const headers = data[0].map(h => h.toString().toLowerCase().trim());
        const skuIndex = headers.indexOf('sku');
        const qtyIndex = headers.indexOf('quantidade');

        if (skuIndex === -1 || qtyIndex === -1) {
            setError('A planilha deve conter as colunas "SKU" e "Quantidade".');
            return;
        }

        const salesToProcess = [];
        let rowErrors = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row.length === 0 || !row[skuIndex]) continue;

            const sku = String(row[skuIndex]);
            const qtde = parseInt(row[qtyIndex], 10);

            if (isNaN(qtde) || qtde <= 0) {
                 rowErrors.push(`Quantidade inválida para o SKU ${sku} na linha ${i + 1}.`);
                 continue;
            }

            const productInInventory = inventory.find(item => item.sku === sku);
            if (!productInInventory) {
                rowErrors.push(`SKU "${sku}" na linha ${i + 1} não encontrado no seu estoque.`);
                continue;
            }
            if (productInInventory.estoque < qtde) {
                rowErrors.push(`Estoque insuficiente para "${productInInventory.nome}" (SKU: ${sku}) na linha ${i + 1}.`);
                continue;
            }
            salesToProcess.push({ ...productInInventory, qtde });
        }
        
        if (rowErrors.length > 0) {
             setError(rowErrors.slice(0, 3).join(' ')); // Mostra os 3 primeiros erros
             return;
        }
        if (salesToProcess.length === 0) {
            setError("Nenhum registro de venda válido foi encontrado na planilha.");
            return;
        }
        setParsedData(salesToProcess);
    };
    
    const handleRegisterSales = () => {
        if (parsedData.length === 0) return;
    
        const allSales = getItem('sales') || [];
        const currentInventory = getItem('inventory') || [];
    
        // Para o registro de venda, agrupamos todos os itens da planilha em uma única transação
        const newSaleItems = parsedData.map(item => ({
            productId: item.productId,
            sku: item.sku,
            qtde: item.qtde,
            precoUnit: item.precoSugerido
        }));
    
        const totalBruto = newSaleItems.reduce((acc, item) => acc + (item.qtde * item.precoUnit), 0);
    
        const newSale = {
            id: generateId(),
            retailerId: user.actorId,
            dataISO: new Date().toISOString(),
            clienteId: 'consumidor_final',
            itens: newSaleItems,
            totalBruto: totalBruto,
            desconto: 0,
            totalLiquido: totalBruto,
            formaPagamento: 'Upload de Planilha',
        };
    
        setItem('sales', [...allSales, newSale]);
    
        // Atualiza o estoque
        const updatedInventory = currentInventory.map(invItem => {
            const itemSold = parsedData.find(p => p.productId === invItem.productId);
            if (itemSold) {
                // Se um produto aparece várias vezes na planilha, precisamos somar as quantidades
                const totalQtdeSold = parsedData
                    .filter(p => p.productId === invItem.productId)
                    .reduce((sum, current) => sum + current.qtde, 0);
                return { ...invItem, estoque: invItem.estoque - totalQtdeSold };
            }
            return invItem;
        });
        setItem('inventory', updatedInventory);
    
        setSuccess(`${parsedData.length} registros de venda foram agrupados e registrados com sucesso!`);
        resetState();
    };

    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    const triggerFileSelect = () => fileInputRef.current.click();

    if (!user) return <Container><p>Carregando...</p></Container>;

    if (parsedData.length > 0) {
        return (
            <Container fluid className="p-4">
                 <h3 className="mb-3">Pré-visualização das Vendas</h3>
                 <p>Encontramos <strong>{parsedData.length}</strong> registros de venda no arquivo "{fileName}". Revise e confirme para registrar.</p>
                 {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                 <Table striped bordered hover responsive size="sm">
                     <thead><tr><th>SKU</th><th>Produto</th><th>Quantidade</th><th className="text-end">Subtotal</th></tr></thead>
                     <tbody>
                         {parsedData.map((item, index) => (
                             <tr key={index}>
                                 <td>{item.sku}</td>
                                 <td>{item.nome}</td>
                                 <td>{item.qtde}</td>
                                 <td className="text-end">R$ {(item.qtde * item.precoSugerido).toFixed(2)}</td>
                             </tr>
                         ))}
                     </tbody>
                 </Table>
                 <div className="d-flex gap-2 mt-3">
                     <Button variant="primary" onClick={handleRegisterSales}>Confirmar e Registrar Vendas</Button>
                     <Button variant="outline-secondary" onClick={resetState}>Cancelar Upload</Button>
                 </div>
            </Container>
        );
    }

    return (
        <div className="upload-container">
            <h2 className="text-center">Importar dados de vendas</h2>
            <p className="text-center text-muted mb-4">Arraste e solte seu arquivo ou selecione-o do seu computador.</p>
            {error && <Alert variant="danger" className="mx-auto" style={{maxWidth: '600px'}} onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" className="mx-auto" style={{maxWidth: '600px'}}>{success}</Alert>}
            <div 
                className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
            >
                <input
                    type="file" ref={fileInputRef} onChange={handleFileSelect}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    style={{ display: 'none' }}
                />
                <div className="drop-zone-content">
                    <div className="drop-zone-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-file-earmark-text drop-zone-icon" viewBox="0 0 16 16">
                            <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                            <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                        </svg>
                    </div>
                    <h5>Arraste e solte seu arquivo CSV aqui</h5>
                    <p className="text-muted my-3">ou</p>
                    <Button variant="success" className="btn-upload" onClick={triggerFileSelect}>
                       Selecione um arquivo do seu computador
                    </Button>
                    <p className="text-muted mt-3"><small>Aceitamos arquivos no formato .CSV ou .XLSX.</small></p>
                </div>
            </div>
            <p className="text-center mt-4">Não sabe por onde começar? <a href="#">Baixe nosso modelo de planilha</a></p>
        </div>
    );
};

export default UploadPOS;

