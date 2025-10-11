// --- ARQUIVO CORRIGIDO: src/pages/retail/pos/UploadPOS.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript ---

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Button, Alert, Table, Row, Col, Form, Card, Modal, Badge } from 'react-bootstrap';
import { GripVertical, CheckCircleFill, XCircleFill, DashCircleFill, PlusCircle } from 'react-bootstrap-icons';

const PLATFORM_FIELDS = [
    { key: 'product_sku', name: 'SKU do Produto', required: true },
    { key: 'sale_date', name: 'Data da Venda', required: true },
    { key: 'quantity', name: 'Quantidade', required: true },
    { key: 'unit_price', name: 'Preço de Venda', required: true },
    { key: 'transaction_id', name: 'ID da Venda', required: false }
];

const UploadPOS = () => {
    const { user } = useAuth();
    const [step, setStep] = useState('upload');
    const [fileHeaders, setFileHeaders] = useState([]);
    const [fileRawData, setFileRawData] = useState([]);
    const [columnMap, setColumnMap] = useState({});
    const [columnOrder, setColumnOrder] = useState([...PLATFORM_FIELDS]);
    const [validationResults, setValidationResults] = useState({ all: [], valid: [], newProduct: [], error: [] });
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const fileInputRef = useRef(null);

    const parseDate = (dateString) => {
        if (dateString instanceof Date && !isNaN(dateString)) return dateString;
        if (typeof dateString !== 'string') {
            const attempted = new Date(dateString);
            return isNaN(attempted) ? new Date('invalid') : attempted;
        }
        
        const trimmed = dateString.trim();
        if (!trimmed) return new Date('invalid');
        
        const brFormatMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
        if (brFormatMatch) {
            const [, day, month, year, hour = 0, minute = 0, second = 0] = brFormatMatch;
            const date = new Date(
                parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10),
                parseInt(hour, 10), parseInt(minute, 10), parseInt(second, 10)
            );
            if (!isNaN(date.getTime())) return date;
        }
        
        const isoDate = new Date(trimmed);
        if (!isNaN(isoDate.getTime())) return isoDate;
        return new Date('invalid');
    };

    useEffect(() => {
        const scriptId = 'xlsx-script';
        if (document.getElementById(scriptId)) return;
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
        script.async = true;
        document.body.appendChild(script);
        return () => { 
            const el = document.getElementById(scriptId); 
            if (el) el.remove(); 
        };
    }, []);

    const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId) : [], [user]);

    const resetForNewUpload = () => {
        setStep('upload'); 
        setFileHeaders([]); 
        setFileRawData([]); 
        setColumnMap({});
        setColumnOrder([...PLATFORM_FIELDS]);
        setValidationResults({ all: [], valid: [], newProduct: [], error: [] }); 
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const processFile = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            if (typeof window.XLSX === 'undefined') {
                setError("A biblioteca de leitura de planilhas não pôde ser carregada.");
                return;
            }
            try {
                const bstr = evt.target.result;
                const wb = window.XLSX.read(bstr, { 
                    type: 'binary', cellDates: true, raw: false, codepage: 65001
                });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = window.XLSX.utils.sheet_to_json(ws, { 
                    header: 1, raw: false, defval: ''
                });
                const headers = data[0].map(h => String(h).trim());
                const rawData = data.slice(1).filter(row => 
                    !row.every(cell => cell === null || cell === '' || cell === undefined)
                );
                setFileHeaders(headers);
                setFileRawData(rawData);
                autoMapColumns(headers);
                setStep('mapping');
            } catch (e) {
                console.error('Erro ao processar arquivo:', e);
                setError("Ocorreu um erro ao ler o arquivo. Verifique se o formato está correto.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const autoMapColumns = (headers) => {
        const newMap = {};
        const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[_\s-]+/g, ''));
        
        const mappings = {
            product_sku: ['sku', 'codigo', 'produto', 'codigoproduto', 'skuproduto'],
            sale_date: ['data', 'datavenda', 'date', 'datetime', 'datahora'],
            quantity: ['quantidade', 'qtd', 'qtde', 'quantity', 'quant'],
            unit_price: ['preco', 'precovenda', 'valor', 'price', 'precounitario', 'valorunitario'],
            transaction_id: ['id', 'idvenda', 'transacao', 'pedido', 'numpedido', 'numvenda']
        };

        PLATFORM_FIELDS.forEach(field => {
            const keywords = mappings[field.key];
            const foundIndex = normalizedHeaders.findIndex(h => 
                keywords.some(keyword => h.includes(keyword))
            );
            newMap[field.key] = foundIndex >= 0 ? headers[foundIndex] : '';
        });
        
        setColumnMap(newMap);
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        const newOrder = [...columnOrder];
        const draggedItem = newOrder[draggedIndex];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(index, 0, draggedItem);
        
        setColumnOrder(newOrder);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleValidation = () => {
        setError('');
        const mappedIndices = {};
        
        for (const field of PLATFORM_FIELDS.filter(f => f.required)) {
            if (!columnMap[field.key]) {
                setError(`O campo obrigatório "${field.name}" precisa ser mapeado.`);
                return;
            }
            mappedIndices[field.key] = fileHeaders.indexOf(columnMap[field.key]);
        }
        
        for (const field of PLATFORM_FIELDS.filter(f => !f.required)) {
            if (columnMap[field.key]) {
                mappedIndices[field.key] = fileHeaders.indexOf(columnMap[field.key]);
            }
        }

        const hasTransactionId = mappedIndices.transaction_id !== undefined && columnMap.transaction_id;
        const results = { all: [], valid: [], newProduct: [], error: [], hasTransactionId };
        
        fileRawData.forEach((row, index) => {
            const cleanValue = (value) => {
                if (value === null || value === undefined || value === '') return null;
                return String(value).trim();
            };

            let productSku = cleanValue(row[mappedIndices.product_sku]);
            if (productSku && productSku.toLowerCase().startsWith('sku-')) {
                productSku = productSku.substring(4).trim();
            }

            const quantityRaw = cleanValue(row[mappedIndices.quantity]);
            const unitPriceRaw = cleanValue(row[mappedIndices.unit_price]);
            const saleDateRaw = row[mappedIndices.sale_date];
            const transactionId = mappedIndices.transaction_id !== undefined 
                ? cleanValue(row[mappedIndices.transaction_id]) 
                : null;

            let parsedDate;
            if (saleDateRaw instanceof Date && !isNaN(saleDateRaw)) {
                parsedDate = saleDateRaw;
            } else {
                parsedDate = parseDate(String(saleDateRaw));
            }

            const saleData = {
                productSku: productSku,
                quantity: quantityRaw ? parseFloat(quantityRaw.replace(',','.')) : NaN,
                unitPrice: unitPriceRaw ? parseFloat(unitPriceRaw.replace(',','.')) : NaN,
                saleDate: parsedDate,
                transactionId: transactionId,
                originalRow: index + 2,
                rawDateValue: saleDateRaw
            };
            
            let status = 'valid';
            const product = inventory.find(p => p.sku === productSku);

            if (!product) status = 'newProduct';
            else if (isNaN(saleData.quantity) || saleData.quantity <= 0) status = 'error';
            else if (isNaN(saleData.unitPrice) || saleData.unitPrice < 0) status = 'error';
            else if (isNaN(saleData.saleDate.getTime())) status = 'error';
            
            const resultRow = { ...saleData, status, product, productName: product?.nome || productSku };
            results.all.push(resultRow);
            results[status].push(resultRow);
        });
        
        setValidationResults(results);
        setStep('validation');
    };
    
    const handleFinalImport = () => {
        const allSales = getItem('sales') || [];
        
        const salesWithIds = validationResults.valid.map(item => ({
            ...item,
            transactionId: item.transactionId || `SALE-${Date.now()}-${generateId()}`
        }));

        const groupedSales = {};
        salesWithIds.forEach(item => {
            const txId = item.transactionId;
            if (!groupedSales[txId]) {
                groupedSales[txId] = {
                    transactionId: txId,
                    saleDate: item.saleDate,
                    items: []
                };
            }
            groupedSales[txId].items.push(item);
        });
        
        const newSales = Object.values(groupedSales).map(group => {
            const total = group.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            
            // --- CORREÇÃO APLICADA AQUI ---
            const clienteId = 'consumidor_final_' + user.actorId;

            return {
                id: generateId(), 
                retailerId: user.actorId, 
                dataISO: group.saleDate.toISOString(),
                clienteId: clienteId, // Corrigido
                itens: group.items.map(item => ({
                    productId: item.product?.productId || item.product?.id,
                    sku: item.product?.sku || item.productSku || 'SKU-UNKNOWN',
                    qtde: item.quantity, 
                    precoUnit: item.unitPrice,
                    precoCusto: item.unitPrice * 0.7
                })),
                totalBruto: total, 
                desconto: 0, 
                totalLiquido: total, 
                formaPagamento: 'Upload de Planilha',
                transactionIdOriginal: group.transactionId
            };
        });
        
        if (newSales.length === 0) {
            setError('Nenhuma venda válida para importar.');
            return;
        }
        
        let currentInventory = getItem('inventory') || [];
        
        for (const sale of newSales) {
            for (const cartItem of sale.itens) {
                let quantityToDeduct = cartItem.qtde;

                const productBatches = currentInventory
                    .filter(inv => inv.productId === cartItem.productId && inv.estoque > 0)
                    .sort((a, b) => new Date(a.dataValidade) - new Date(b.dataValidade));

                for (const batch of productBatches) {
                    if (quantityToDeduct === 0) break;
                    const deductAmount = Math.min(quantityToDeduct, batch.estoque);
                    batch.estoque -= deductAmount;
                    quantityToDeduct -= deductAmount;
                }
            }
        }
        
        setItem('inventory', currentInventory);
        setItem('sales', [...allSales, ...newSales]);
        
        alert(`✅ ${newSales.length} venda(s) importada(s) com sucesso!`);
        resetForNewUpload();
    };

    const renderStep = () => {
        switch (step) {
            case 'mapping': 
                return <MappingStep 
                    headers={fileHeaders} 
                    map={columnMap} 
                    setMap={setColumnMap} 
                    columnOrder={columnOrder}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDragEnd={handleDragEnd}
                    draggedIndex={draggedIndex}
                    onVerify={handleValidation} 
                    onCancel={resetForNewUpload} 
                    error={error} 
                    setError={setError} 
                />;
            case 'validation': 
                return <ValidationStep 
                    results={validationResults}
                    setValidationResults={setValidationResults}
                    onConfirm={handleFinalImport} 
                    onCancel={() => setStep('mapping')}
                    user={user}
                    inventory={inventory}
                />;
            default: 
                return <UploadStep 
                    processFile={processFile} 
                    isDragging={isDragging} 
                    setIsDragging={setIsDragging} 
                    fileInputRef={fileInputRef} 
                />;
        }
    };
    
    if (!user) return <Container><p>Carregando...</p></Container>;
    return <div className="upload-container">{renderStep()}</div>;
};

const UploadStep = ({ processFile, isDragging, setIsDragging, fileInputRef }) => {
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };
    const handleFileSelect = (e) => processFile(e.target.files[0]);
    const triggerFileSelect = () => fileInputRef.current.click();

    return (
        <Container className="py-5">
            <div className="text-center mb-4">
                <h2>Importar Vendas por Planilha</h2>
                <p className="text-muted">Arraste e solte seu arquivo ou clique para selecionar</p>
            </div>
            <div 
                className="border-3 border-dashed rounded p-5 text-center"
                style={{ 
                    borderColor: isDragging ? '#0d6efd' : '#dee2e6',
                    backgroundColor: isDragging ? '#e7f1ff' : '#f8f9fa',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    borderStyle: 'dashed'
                }}
                onDragEnter={handleDragEnter} 
                onDragLeave={handleDragLeave} 
                onDragOver={handleDragOver} 
                onDrop={handleDrop}
                onClick={triggerFileSelect}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept=".csv,.xlsx,.xls" 
                    style={{ display: 'none' }} 
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-cloud-arrow-up text-primary mb-3" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M7.646 5.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2z"/>
                    <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z"/>
                </svg>
                <h5>Arraste seu arquivo aqui</h5>
                <p className="text-muted mb-3">ou clique para selecionar</p>
                <Button variant="primary" size="lg">Selecionar Arquivo</Button>
                <p className="text-muted small mt-3">Formatos aceitos: .CSV, .XLSX, .XLS</p>
            </div>
        </Container>
    );
};

const MappingStep = ({ headers, map, setMap, columnOrder, handleDragStart, handleDragOver, handleDragEnd, draggedIndex, onVerify, onCancel, error, setError }) => {
    const handleSelectChange = (platformKey, selectedHeader) => {
        setMap(prevMap => ({ ...prevMap, [platformKey]: selectedHeader }));
    };

    const mappedRequired = columnOrder.filter(f => f.required && map[f.key]).length;
    const totalRequired = columnOrder.filter(f => f.required).length;

    return (
        <Container className="py-4">
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            <div className="mb-4">
                <h2>Mapear Colunas</h2>
                <p className="text-muted">Arraste para reordenar e mapeie as colunas da sua planilha</p>
            </div>

            <Row>
                <Col lg={8}>
                    <Card>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">Colunas do Sistema</h5>
                                <Badge bg={mappedRequired === totalRequired ? 'success' : 'warning'}>
                                    {mappedRequired}/{totalRequired} obrigatórios
                                </Badge>
                            </div>
                            
                            {columnOrder.map((field, index) => (
                                <div 
                                    key={field.key}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className="mb-3 p-3 border rounded"
                                    style={{ 
                                        backgroundColor: draggedIndex === index ? '#e7f1ff' : '#f8f9fa',
                                        cursor: 'grab',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Row className="align-items-center">
                                        <Col xs="auto">
                                            <GripVertical size={24} className="text-secondary" />
                                        </Col>
                                        <Col xs={1} className="text-center">
                                            <Badge bg="primary" style={{ fontSize: '1.1rem', padding: '8px 12px' }}>
                                                {index + 1}
                                            </Badge>
                                        </Col>
                                        <Col xs={3}>
                                            <div>
                                                <strong>{field.name}</strong>
                                                <br/>
                                                {field.required ? (
                                                    <Badge bg="danger" className="mt-1">Obrigatório</Badge>
                                                ) : (
                                                    <Badge bg="secondary" className="mt-1">Opcional</Badge>
                                                )}
                                            </div>
                                        </Col>
                                        <Col>
                                            <Form.Select 
                                                value={map[field.key] || ''} 
                                                onChange={(e) => handleSelectChange(field.key, e.target.value)}
                                                className={map[field.key] ? 'border-success border-2' : ''}
                                                size="lg"
                                            >
                                                <option value="">Selecione...</option>
                                                {headers.map((header, idx) => (
                                                    <option key={idx} value={header}>{header}</option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                    </Row>
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col lg={4}>
                    <Card className="bg-light border-primary">
                        <Card.Body>
                            <h6 className="mb-3">📋 Instruções</h6>
                            <ul className="small mb-3">
                                <li>Arraste os campos para reordenar</li>
                                <li>Mapeie todos os campos obrigatórios</li>
                                <li>ID da Venda é opcional (será gerado)</li>
                            </ul>
                            <hr/>
                            <h6 className="mb-3">✅ Status do Mapeamento</h6>
                            {columnOrder.map(field => (
                                <div key={field.key} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded">
                                    <small className="fw-medium">{field.name}</small>
                                    {map[field.key] ? (
                                        <CheckCircleFill size={18} className="text-success" />
                                    ) : field.required ? (
                                        <XCircleFill size={18} className="text-danger" />
                                    ) : (
                                        <DashCircleFill size={18} className="text-secondary" />
                                    )}
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" size="lg" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={onVerify}
                    disabled={mappedRequired < totalRequired}
                >
                    Validar Dados →
                </Button>
            </div>
        </Container>
    );
};

const ValidationStep = ({ results, setValidationResults, onConfirm, onCancel, user, inventory }) => {
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [linkMode, setLinkMode] = useState('existing'); // 'existing' or 'new'
    const [selectedProduct, setSelectedProduct] = useState('');
    const [newProductForm, setNewProductForm] = useState({
        nome: '',
        sku: '',
        categoria: 'Alimentos',
        marca: 'Genérico',
        estoque: 0,
        custoMedio: 0,
        precoVenda: 0
    });

    const canProceed = results.newProduct.length === 0 && results.error.length === 0;

    const renderDate = (date) => {
        if (date instanceof Date && !isNaN(date)) {
            return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        return <span className="text-danger">Data Inválida</span>;
    };

    const handleOpenLinkModal = (row) => {
        setSelectedRow(row);
        setNewProductForm({
            nome: row.productSku,
            sku: row.productSku || `SKU-${Date.now()}`,
            categoria: 'Alimentos',
            marca: 'Genérico',
            estoque: row.quantity || 0,
            custoMedio: row.unitPrice * 0.7,
            precoVenda: row.unitPrice
        });
        setShowLinkModal(true);
    };

    const handleLinkProduct = () => {
        if (linkMode === 'existing') {
            if (!selectedProduct) {
                alert('Selecione um produto do estoque');
                return;
            }

            const product = inventory.find(p => p.productId === selectedProduct);
            
            const updatedResults = {
                ...results,
                all: results.all.map(r => 
                    r.originalRow === selectedRow.originalRow 
                        ? { ...r, status: 'valid', product, productName: product.nome, productSku: product.sku }
                        : r
                )
            };
            
            updatedResults.valid = updatedResults.all.filter(r => r.status === 'valid');
            updatedResults.newProduct = updatedResults.all.filter(r => r.status === 'newProduct');
            updatedResults.error = updatedResults.all.filter(r => r.status === 'error');
            
            setValidationResults(updatedResults);
            setShowLinkModal(false);
            setSelectedProduct('');
        } else {
            // Criar novo produto
            const allProducts = getItem('products') || [];
            const allInventory = getItem('inventory') || [];
            
            const productId = generateId();
            
            const newProduct = {
                id: productId,
                sku: newProductForm.sku,
                nome: newProductForm.nome,
                categoria: newProductForm.categoria,
                subcategoria: newProductForm.categoria,
                industryId: 'generic',
                precoSugerido: parseFloat(newProductForm.precoVenda),
                supplierIds: [],
                marca: newProductForm.marca
            };
            
            setItem('products', [...allProducts, newProduct]);
            
            const validade = new Date();
            validade.setDate(validade.getDate() + 90);
            
            const newInventoryItem = {
                id: generateId(),
                retailerId: user.actorId,
                productId: productId,
                nome: newProductForm.nome,
                sku: newProductForm.sku,
                categoria: newProductForm.categoria,
                marca: newProductForm.marca,
                estoque: parseInt(newProductForm.estoque),
                custoMedio: parseFloat(newProductForm.custoMedio),
                precoVenda: parseFloat(newProductForm.precoVenda),
                precoSugerido: parseFloat(newProductForm.precoVenda),
                dataValidade: validade.toISOString()
            };
            
            setItem('inventory', [...allInventory, newInventoryItem]);
            
            const productForUpdate = {
                productId: productId,
                sku: newProductForm.sku,
                nome: newProductForm.nome
            };
            
            const updatedResults = {
                ...results,
                all: results.all.map(r => 
                    r.originalRow === selectedRow.originalRow 
                        ? { ...r, status: 'valid', product: productForUpdate, productName: newProductForm.nome, productSku: newProductForm.sku }
                        : r
                )
            };
            
            updatedResults.valid = updatedResults.all.filter(r => r.status === 'valid');
            updatedResults.newProduct = updatedResults.all.filter(r => r.status === 'newProduct');
            updatedResults.error = updatedResults.all.filter(r => r.status === 'error');
            
            setValidationResults(updatedResults);
            setShowLinkModal(false);
        }
    };

    return (
        <Container className="py-4">
            <h2 className="mb-3">Validação de Dados</h2>
            
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="text-center border-success">
                        <Card.Body>
                            <h3 className="text-success mb-0">{results.valid.length}</h3>
                            <small className="text-muted">Vendas Válidas</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center border-warning">
                        <Card.Body>
                            <h3 className="text-warning mb-0">{results.newProduct.length}</h3>
                            <small className="text-muted">SKUs Não Identificados</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center border-danger">
                        <Card.Body>
                            <h3 className="text-danger mb-0">{results.error.length}</h3>
                            <small className="text-muted">Erros</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {!results.hasTransactionId && (
                <Alert variant="info">
                    <strong>ℹ️ ID de Venda não encontrado.</strong> Um ID único será gerado automaticamente para cada grupo de vendas.
                </Alert>
            )}

            {results.newProduct.length > 0 && (
                <Alert variant="warning">
                    <strong>⚠️ Ação necessária:</strong> Existem {results.newProduct.length} SKU(s) não identificado(s). 
                    Vincule cada um a um produto existente ou cadastre um novo produto.
                </Alert>
            )}

            <Card>
                <Card.Body className="p-0">
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <Table hover className="mb-0">
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1, boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)' }}>
                                <tr>
                                    <th>Data/Hora</th>
                                    <th>SKU</th>
                                    <th>Produto</th>
                                    <th className="text-center">Qtd</th>
                                    <th className="text-end">Preço Unit.</th>
                                    <th className="text-end">Total</th>
                                    <th>ID Venda</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.all.map((row, index) => {
                                    const total = row.quantity * row.unitPrice;
                                    return (
                                        <tr key={index} className={
                                            row.status === 'valid' ? 'table-success' : 
                                            row.status === 'newProduct' ? 'table-warning' : 
                                            'table-danger'
                                        }>
                                            <td><small>{renderDate(row.saleDate)}</small></td>
                                            <td><code className="bg-white px-2 py-1 rounded">{row.productSku}</code></td>
                                            <td>{row.productName}</td>
                                            <td className="text-center"><strong>{row.quantity}</strong></td>
                                            <td className="text-end">R$ {row.unitPrice.toFixed(2)}</td>
                                            <td className="text-end"><strong>R$ {total.toFixed(2)}</strong></td>
                                            <td><small className="text-muted">{row.transactionId || '(será gerado)'}</small></td>
                                            <td className="text-center">
                                                {row.status === 'valid' && <Badge bg="success">✓ OK</Badge>}
                                                {row.status === 'newProduct' && <Badge bg="warning" text="dark">Não Identificado</Badge>}
                                                {row.status === 'error' && <Badge bg="danger">✗ Erro</Badge>}
                                            </td>
                                            <td className="text-center">
                                                {row.status === 'newProduct' && (
                                                    <Button 
                                                        variant="primary" 
                                                        size="sm"
                                                        onClick={() => handleOpenLinkModal(row)}
                                                    >
                                                        <PlusCircle size={14} className="me-1" />
                                                        Vincular
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" size="lg" onClick={onCancel}>
                    ← Voltar ao Mapeamento
                </Button>
                <Button 
                    variant="success" 
                    size="lg"
                    onClick={onConfirm}
                    disabled={!canProceed}
                >
                    {canProceed ? (
                        <>Confirmar e Importar {results.valid.length} Venda(s) ✓</>
                    ) : (
                        <>Vincule os SKUs Antes de Importar</>
                    )}
                </Button>
            </div>

            {/* Modal de Vincular/Criar Produto */}
            <Modal show={showLinkModal} onHide={() => setShowLinkModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Vincular SKU: {selectedRow?.productSku}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info">
                        <strong>SKU não identificado.</strong> Escolha vincular a um produto existente ou cadastrar um novo.
                    </Alert>

                    <div className="mb-4">
                        <Button 
                            variant={linkMode === 'existing' ? 'primary' : 'outline-primary'}
                            className="me-2"
                            onClick={() => setLinkMode('existing')}
                        >
                            Vincular a Produto Existente
                        </Button>
                        <Button 
                            variant={linkMode === 'new' ? 'primary' : 'outline-primary'}
                            onClick={() => setLinkMode('new')}
                        >
                            Cadastrar Novo Produto
                        </Button>
                    </div>

                    {linkMode === 'existing' ? (
                        <div>
                            <Form.Group>
                                <Form.Label>Selecione o Produto do Estoque</Form.Label>
                                <Form.Select 
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    size="lg"
                                >
                                    <option value="">Selecione...</option>
                                    {inventory.map(item => (
                                        <option key={item.productId} value={item.productId}>
                                            {item.nome} ({item.sku}) - Estoque: {item.totalStock}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>
                    ) : (
                        <Form>
                            <Row>
                                <Col md={8}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nome do Produto *</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={newProductForm.nome}
                                            onChange={(e) => setNewProductForm({...newProductForm, nome: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>SKU *</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={newProductForm.sku}
                                            onChange={(e) => setNewProductForm({...newProductForm, sku: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Categoria</Form.Label>
                                        <Form.Select 
                                            value={newProductForm.categoria}
                                            onChange={(e) => setNewProductForm({...newProductForm, categoria: e.target.value})}
                                        >
                                            <option value="Alimentos">Alimentos</option>
                                            <option value="Bebidas">Bebidas</option>
                                            <option value="Limpeza">Limpeza</option>
                                            <option value="Higiene">Higiene</option>
                                            <option value="Outros">Outros</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Marca</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={newProductForm.marca}
                                            onChange={(e) => setNewProductForm({...newProductForm, marca: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Estoque Inicial</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            value={newProductForm.estoque}
                                            onChange={(e) => setNewProductForm({...newProductForm, estoque: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Custo Médio</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            step="0.01"
                                            value={newProductForm.custoMedio}
                                            onChange={(e) => setNewProductForm({...newProductForm, custoMedio: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Preço de Venda</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            step="0.01"
                                            value={newProductForm.precoVenda}
                                            onChange={(e) => setNewProductForm({...newProductForm, precoVenda: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowLinkModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleLinkProduct}>
                        {linkMode === 'existing' ? 'Vincular Produto' : 'Cadastrar e Vincular'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UploadPOS;