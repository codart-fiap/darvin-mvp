// FILE: src/pages/retail/pos/OnlineSheetPOS.jsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Table, Button, Alert, Card, Form, Row, Col } from 'react-bootstrap';
import { PlusCircleFill, Trash3Fill, InfoCircleFill } from 'react-bootstrap-icons';

const OnlineSheetPOS = () => {
    const { user } = useAuth();
    const [rows, setRows] = useState([{ productId: '', qtde: 1, error: null }]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId).filter(item => item.totalStock > 0) : [], [user, lastUpdated]);

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        const newRow = { ...newRows[index], [field]: value, error: null };

        if (field === 'productId') {
            const product = inventory.find(p => p.productId === value);
            newRow.precoUnit = product ? product.avgPrice : 0;
        }

        newRows[index] = newRow;
        setRows(newRows);
    };

    const addRow = () => setRows([...rows, { productId: '', qtde: 1, error: null }]);
    const removeRow = (index) => setRows(rows.filter((_, i) => i !== index));

    const validateRows = () => {
        let isValid = true;
        const newRows = [...rows];
        const productQuantities = {};

        for (let i = 0; i < newRows.length; i++) {
            const row = newRows[i];
            const product = inventory.find(p => p.productId === row.productId);
            
            if (!row.productId) {
                row.error = "Selecione um produto.";
                isValid = false;
            } else {
                productQuantities[row.productId] = (productQuantities[row.productId] || 0) + Number(row.qtde);
                if (productQuantities[row.productId] > product.totalStock) {
                    row.error = `Estoque insuficiente. Disponível: ${product.totalStock}`;
                    isValid = false;
                }
            }
        }
        
        if (!isValid) setRows(newRows);
        return isValid;
    };

    const handleRegisterSales = () => {
        setError('');
        setSuccess('');

        if (!validateRows()) {
            setError("Verifique os erros na planilha antes de continuar.");
            return;
        }

        console.log('[ANOTA AÍ] 🚀 Iniciando registro de vendas...');

        // 1. Prepara os itens da venda
        const saleItems = rows.map(row => {
            const product = inventory.find(p => p.productId === row.productId);
            return {
                productId: product.productId, 
                sku: product.sku,
                qtde: Number(row.qtde), 
                precoUnit: product.avgPrice
            };
        });

        const totalLiquido = saleItems.reduce((acc, item) => acc + (item.qtde * item.precoUnit), 0);

        // 2. CRÍTICO: Atualiza o estoque ANTES de registrar a venda
        let rawInventory = getItem('inventory') || [];
        console.log('[ANOTA AÍ] 🔍 Estoque RAW antes:', rawInventory.length, 'lotes');

        for (const saleItem of saleItems) {
            let quantityToDeduct = saleItem.qtde;
            console.log(`[ANOTA AÍ] 📦 Processando: ProductID ${saleItem.productId}, Qtd: ${quantityToDeduct}`);

            // Filtra lotes deste varejista e produto, com estoque disponível
            const availableBatches = rawInventory
                .map((batch, index) => ({ ...batch, arrayIndex: index }))
                .filter(batch => 
                    batch.retailerId === user.actorId && 
                    batch.productId === saleItem.productId && 
                    batch.estoque > 0
                )
                .sort((a, b) => new Date(a.dataValidade) - new Date(b.dataValidade)); // FEFO

            console.log(`[ANOTA AÍ] 📋 Lotes disponíveis:`, availableBatches.length);

            // Deduz quantidade lote por lote
            for (const batch of availableBatches) {
                if (quantityToDeduct === 0) break;
                
                const deductAmount = Math.min(quantityToDeduct, batch.estoque);
                console.log(`[ANOTA AÍ]   ➖ Lote ${batch.id.substring(0, 8)}: Deduzindo ${deductAmount} (Tinha: ${batch.estoque})`);
                
                // Atualiza o array original
                rawInventory[batch.arrayIndex].estoque -= deductAmount;
                quantityToDeduct -= deductAmount;
                
                console.log(`[ANOTA AÍ]   ✅ Novo estoque: ${rawInventory[batch.arrayIndex].estoque}`);
            }

            if (quantityToDeduct > 0) {
                console.error(`[ANOTA AÍ] ❌ ERRO: Faltam ${quantityToDeduct} unidades!`);
                setError(`Estoque insuficiente para completar a operação.`);
                return; // Cancela tudo
            }
        }

        // 3. Salva o inventário atualizado
        console.log('[ANOTA AÍ] 💾 Salvando inventário...');
        setItem('inventory', rawInventory);

        // Verifica se salvou
        const verificacao = getItem('inventory');
        console.log('[ANOTA AÍ] ✅ Verificação:', verificacao.length, 'lotes salvos');

        // 4. Registra a venda
        const newSale = {
            id: generateId(), 
            retailerId: user.actorId, 
            dataISO: new Date().toISOString(),
            clienteId: 'consumidor_final', 
            itens: saleItems, 
            totalBruto: totalLiquido,
            desconto: 0, 
            totalLiquido: totalLiquido, 
            formaPagamento: 'Anota Aí',
        };

        const allSales = getItem('sales') || [];
        setItem('sales', [...allSales, newSale]);
        console.log('[ANOTA AÍ] 💰 Venda registrada!');

        // 5. Limpa e atualiza a interface
        setSuccess(`${saleItems.length} registros de venda foram agrupados e registrados com sucesso! Estoque atualizado.`);
        setRows([{ productId: '', qtde: 1, error: null }]);
        setLastUpdated(Date.now());
        console.log('[ANOTA AÍ] 🔄 Interface atualizada!');
    };

    return (
        <Container fluid>
            <h1 className="h3 mb-3">Anota Aí</h1>

            <Row>
                <Col lg={8}>
                    <Card>
                        <Card.Body>
                            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
                            <Table responsive>
                                <thead>
                                    <tr>
                                        <th style={{width: '60%'}}>Produto</th>
                                        <th style={{width: '15%'}}>Quantidade</th>
                                        <th style={{width: '15%'}}>Subtotal</th>
                                        <th style={{width: '10%'}}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr key={index}>
                                            <td>
                                                <Form.Select value={row.productId} onChange={(e) => handleRowChange(index, 'productId', e.target.value)} isInvalid={!!row.error}>
                                                    <option value="">Selecione um produto...</option>
                                                    {inventory.map(item => (
                                                        <option key={item.productId} value={item.productId}>
                                                            {item.nome} (Estoque: {item.totalStock})
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                <Form.Control.Feedback type="invalid">{row.error}</Form.Control.Feedback>
                                            </td>
                                            <td><Form.Control type="number" value={row.qtde} onChange={(e) => handleRowChange(index, 'qtde', e.target.value)} min="1" /></td>
                                            <td>R$ {( (row.precoUnit || 0) * row.qtde).toFixed(2)}</td>
                                            <td>
                                                <Button variant="danger" size="sm" onClick={() => removeRow(index)} disabled={rows.length === 1}>
                                                    <Trash3Fill />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <Button variant="outline-primary" size="sm" onClick={addRow}>
                                <PlusCircleFill className="me-2" />
                                Adicionar Linha
                            </Button>
                        </Card.Body>
                        <Card.Footer className="text-end">
                            <Button variant="success" onClick={handleRegisterSales} disabled={rows.some(r => !r.productId)}>
                                Registrar Todas as Vendas
                            </Button>
                        </Card.Footer>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="bg-light border-0">
                        <Card.Body>
                            <Card.Title><InfoCircleFill className="me-2" />Como funciona?</Card.Title>
                            <Card.Text>
                                O "Anota Aí" é perfeito para registrar rapidamente múltiplas vendas que aconteceram ao longo do dia.
                            </Card.Text>
                            <ol className="small ps-3">
                                <li>Adicione uma linha para cada produto vendido.</li>
                                <li>Ajuste as quantidades de cada um.</li>
                                <li>Clique em "Registrar Todas as Vendas".</li>
                            </ol>
                            <Card.Text className="small">
                                Todas as vendas serão agrupadas em uma única transação para simplificar seu histórico. <strong>O estoque será automaticamente atualizado.</strong>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default OnlineSheetPOS;