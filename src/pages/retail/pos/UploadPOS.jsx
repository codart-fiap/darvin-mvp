// --- ARQUIVO: src/pages/retail/pos/UploadPOS.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript ---

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Button, Alert, Table, Row, Col, Form, OverlayTrigger, Tooltip, Card, Modal } from 'react-bootstrap';

const PLATFORM_FIELDS = [
    { key: 'product_name', name: 'Nome do Produto', description: 'O nome do produto vendido.', tooltip: 'Este campo deve conter o nome ou SKU do produto.', required: true },
    { key: 'quantity', name: 'Quantidade Vendida', description: 'A quantidade de unidades vendidas.', tooltip: 'Informe o número de unidades vendidas.', required: true },
    { key: 'unit_price', name: 'Preço de Venda (Unitário)', description: 'O preço de venda por unidade.', tooltip: 'O valor de venda para uma única unidade.', required: true },
    { key: 'sale_date', name: 'Data da Venda', description: 'A data em que a venda foi realizada.', tooltip: 'A data da transação (ex: DD/MM/AAAA HH:MM:SS).', required: true },
    { key: 'transaction_id', name: 'ID da Transação', description: 'Identificador único da venda (opcional).', tooltip: 'Número do pedido ou código do recibo para agrupar itens.', required: false },
    { key: 'unit_cost', name: 'Preço de Custo (Unitário)', description: 'Custo de aquisição do produto (opcional).', tooltip: 'Valor pago pelo produto para cálculo de lucratividade.', required: false },
    { key: 'product_sku', name: 'SKU / Código do Produto', description: 'Código identificador do produto (opcional).', tooltip: 'Código de barras ou SKU para identificação precisa.', required: false }
];

const CheckmarkIcon = () => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-check-circle-fill text-primary" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
    </svg> 
);

const QuestionIcon = () => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-question-circle" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
    </svg> 
);

const ErrorIcon = () => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-circle-fill me-2 text-danger" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
    </svg> 
);

const UploadPOS = () => {
    const { user } = useAuth();
    const [step, setStep] = useState('upload'); 
    const [fileHeaders, setFileHeaders] = useState([]);
    const [fileRawData, setFileRawData] = useState([]);
    const [columnMap, setColumnMap] = useState({});
    const [validationResults, setValidationResults] = useState({ all: [], valid: [], newProduct: [], error: [] });
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const parseDate = (dateString) => {
        if (dateString instanceof Date && !isNaN(dateString)) {
            return dateString;
        }
        
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
                parseInt(year, 10),
                parseInt(month, 10) - 1,
                parseInt(day, 10),
                parseInt(hour, 10),
                parseInt(minute, 10),
                parseInt(second, 10)
            );
            
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        const isoDate = new Date(trimmed);
        if (!isNaN(isoDate.getTime())) {
            return isoDate;
        }
        
        const usFormatMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (usFormatMatch) {
            const [, monthOrDay, dayOrMonth, year] = usFormatMatch;
            
            const dateBR = new Date(parseInt(year, 10), parseInt(monthOrDay, 10) - 1, parseInt(dayOrMonth, 10));
            if (!isNaN(dateBR.getTime()) && dateBR.getDate() === parseInt(dayOrMonth, 10)) {
                return dateBR;
            }
            
            const dateUS = new Date(parseInt(year, 10), parseInt(monthOrDay, 10) - 1, parseInt(dayOrMonth, 10));
            if (!isNaN(dateUS.getTime())) {
                return dateUS;
            }
        }
        
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

    const handleProductRegistered = (productData, newProduct, newInventoryItem, directUpdate = null) => {
        if (directUpdate) {
            setValidationResults(directUpdate);
            return;
        }

        const updatedResults = {
            ...validationResults,
            all: validationResults.all.map(row => 
                row.productName === productData.productName && row.originalRow === productData.originalRow
                    ? { 
                        ...row, 
                        status: 'valid', 
                        product: {
                            id: newInventoryItem.productId,
                            productId: newInventoryItem.productId,
                            sku: newInventoryItem.sku,
                            nome: newInventoryItem.nome,
                            categoria: newInventoryItem.categoria,
                            marca: newInventoryItem.marca,
                            estoque: newInventoryItem.estoque,
                            custoMedio: newInventoryItem.custoMedio,
                            precoVenda: newInventoryItem.precoVenda
                        }
                    }
                    : row
            )
        };

        updatedResults.valid = updatedResults.all.filter(r => r.status === 'valid');
        updatedResults.newProduct = updatedResults.all.filter(r => r.status === 'newProduct');
        updatedResults.error = updatedResults.all.filter(r => r.status === 'error');

        setValidationResults(updatedResults);
    };

    const resetForNewUpload = () => {
        setStep('upload'); 
        setFileHeaders([]); 
        setFileRawData([]); 
        setColumnMap({});
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
                    type: 'binary', 
                    cellDates: true,
                    raw: false,
                    codepage: 65001
                });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = window.XLSX.utils.sheet_to_json(ws, { 
                    header: 1,
                    raw: false,
                    defval: ''
                });
                const headers = data[0].map(h => String(h).trim());
                const rawData = data.slice(1);
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
        const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[_\s-]+/g, ' '));
        PLATFORM_FIELDS.forEach(field => {
            const fieldNameNormalized = field.name.toLowerCase().replace(/\(unitário\)/, '').trim();
            let found = headers[normalizedHeaders.findIndex(h => h.includes(fieldNameNormalized))];
            if (!found && field.key === 'product_name') {
                found = headers[normalizedHeaders.findIndex(h => h.includes('sku'))];
            }
            newMap[field.key] = found || '';
        });
        setColumnMap(newMap);
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

        const hasTransactionId = mappedIndices.transaction_id !== undefined;
        const groupingStrategy = hasTransactionId ? 'transaction_id' : 'datetime';

        const results = { all: [], valid: [], newProduct: [], error: [], groupingStrategy };
        
        fileRawData.forEach((row, index) => {
            if (row.every(cell => cell === null || cell === '' || cell === undefined)) return;

            const cleanValue = (value) => {
                if (value === null || value === undefined || value === '') return null;
                return String(value).trim();
            };

            const productNameRaw = cleanValue(row[mappedIndices.product_name]);
            const quantityRaw = cleanValue(row[mappedIndices.quantity]);
            const unitPriceRaw = cleanValue(row[mappedIndices.unit_price]);
            const saleDateRaw = row[mappedIndices.sale_date];
            
            const transactionId = mappedIndices.transaction_id !== undefined 
                ? cleanValue(row[mappedIndices.transaction_id]) 
                : null;
            const unitCost = mappedIndices.unit_cost !== undefined 
                ? cleanValue(row[mappedIndices.unit_cost]) 
                : null;
            
            // ✅ CORREÇÃO: Remove o prefixo "SKU-" se existir e limpa o valor
            let productSku = mappedIndices.product_sku !== undefined 
                ? cleanValue(row[mappedIndices.product_sku]) 
                : null;
            
            if (productSku && productSku.toLowerCase().startsWith('sku-')) {
                productSku = productSku.substring(4).trim();
            }

            let parsedDate;
            if (saleDateRaw instanceof Date && !isNaN(saleDateRaw)) {
                parsedDate = saleDateRaw;
            } else {
                parsedDate = parseDate(String(saleDateRaw));
                if (isNaN(parsedDate.getTime())) {
                    console.warn(`⚠️ Linha ${index + 2}: Data inválida "${saleDateRaw}" para produto "${productNameRaw}"`);
                }
            }

            const saleData = {
                productName: productNameRaw,
                quantity: quantityRaw ? parseFloat(quantityRaw.replace(',','.')) : NaN,
                unitPrice: unitPriceRaw ? parseFloat(unitPriceRaw.replace(',','.')) : NaN,
                saleDate: parsedDate,
                transactionId: transactionId,
                unitCost: unitCost ? parseFloat(unitCost.replace(',','.')) : null,
                productSku: productSku,
                originalRow: index + 2,
                rawDateValue: saleDateRaw
            };
            
            let status = 'valid';
            
            // ✅ CORREÇÃO: Busca produto e usa o SKU dele se encontrado
            let product = null;
            if (productSku) {
                product = inventory.find(p => p.sku === productSku);
            }
            if (!product && productNameRaw) {
                product = inventory.find(p => p.nome === productNameRaw);
            }

            // Se encontrou o produto, usa o SKU dele
            const finalSku = product ? product.sku : productSku;

            if (!product) status = 'newProduct';
            else if (isNaN(saleData.quantity) || saleData.quantity <= 0) status = 'error';
            else if (isNaN(saleData.unitPrice) || saleData.unitPrice < 0) status = 'error';
            else if (isNaN(saleData.saleDate.getTime())) status = 'error';
            
            const resultRow = { ...saleData, productSku: finalSku, status, product };
            results.all.push(resultRow);
            results[status].push(resultRow);
        });
        
        setValidationResults(results);
        setStep('validation');
    };
    
    const handleFinalImport = () => {
        const allSales = getItem('sales') || [];
        const allInventory = getItem('inventory') || [];
        
        const groupedSales = groupTransactions(validationResults.valid, validationResults.groupingStrategy);
        
        // ✅ CORREÇÃO: Mapeia quantidades vendidas por productId para desconto de estoque
        const quantitiesSoldByProduct = {};
        
        validationResults.valid.forEach(item => {
            const productId = item.product?.productId || item.product?.id;
            if (productId) {
                quantitiesSoldByProduct[productId] = (quantitiesSoldByProduct[productId] || 0) + item.quantity;
            }
        });
        
        // ✅ CORREÇÃO: Desconta as quantidades vendidas do estoque usando FIFO
        const updatedInventory = allInventory.map(invItem => {
            const soldQty = quantitiesSoldByProduct[invItem.productId];
            
            if (soldQty && soldQty > 0) {
                const newStock = Math.max(0, invItem.estoque - soldQty);
                quantitiesSoldByProduct[invItem.productId] = Math.max(0, soldQty - invItem.estoque);
                
                return {
                    ...invItem,
                    estoque: newStock
                };
            }
            
            return invItem;
        });
        
        setItem('inventory', updatedInventory);
        
        const newSales = groupedSales.map(group => {
            const total = group.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            
            return {
                id: generateId(), 
                retailerId: user.actorId, 
                dataISO: group.saleDate.toISOString(),
                clienteId: 'consumidor_final',
                itens: group.items.map(item => ({
                    productId: item.product?.productId || item.product?.id,
                    sku: item.product?.sku || item.productSku || 'SKU-UNKNOWN',
                    qtde: item.quantity, 
                    precoUnit: item.unitPrice,
                    precoCusto: item.unitCost
                })),
                totalBruto: total, 
                desconto: 0, 
                totalLiquido: total, 
                formaPagamento: 'Upload de Planilha',
                transactionIdOriginal: group.transactionId
            };
        }).filter(sale => sale !== null);
        
        if (newSales.length === 0) {
            setError('Nenhuma venda válida para importar.');
            return;
        }
        
        setItem('sales', [...allSales, ...newSales]);
        
        const message = validationResults.groupingStrategy === 'transaction_id'
            ? `${newSales.length} vendas foram registradas com sucesso! O estoque foi atualizado.`
            : `${newSales.length} vendas foram registradas (agrupadas por data/hora). O estoque foi atualizado.`;
        
        alert(message);
        resetForNewUpload();
    };

    const groupTransactions = (validItems, strategy) => {
        if (strategy === 'transaction_id') {
            const groups = {};
            
            validItems.forEach(item => {
                const txId = item.transactionId || `AUTO-${item.saleDate.getTime()}-${Math.random()}`;
                
                if (!groups[txId]) {
                    groups[txId] = {
                        transactionId: txId,
                        saleDate: item.saleDate,
                        items: []
                    };
                }
                
                groups[txId].items.push(item);
            });
            
            return Object.values(groups);
        } else {
            const groups = {};
            
            validItems.forEach(item => {
                const dateKey = item.saleDate.toISOString();
                
                if (!groups[dateKey]) {
                    groups[dateKey] = {
                        transactionId: null,
                        saleDate: item.saleDate,
                        items: []
                    };
                }
                
                groups[dateKey].items.push(item);
            });
            
            return Object.values(groups);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'mapping': 
                return <MappingStep 
                    headers={fileHeaders} 
                    map={columnMap} 
                    setMap={setColumnMap} 
                    onVerify={handleValidation} 
                    onCancel={resetForNewUpload} 
                    error={error} 
                    setError={setError} 
                />;
            case 'validation': 
                return <ValidationStep 
                    results={validationResults} 
                    onConfirm={handleFinalImport} 
                    onCancel={() => setStep('mapping')}
                    onProductRegistered={handleProductRegistered}
                    user={user}
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
        <div className="upload-step-container">
            <h2 className="text-center">Importar dados de vendas</h2>
            <p className="text-center text-muted mb-4">Arraste e solte seu arquivo ou selecione-o do seu computador.</p>
            <div 
                className="drop-zone" 
                onDragEnter={handleDragEnter} 
                onDragLeave={handleDragLeave} 
                onDragOver={handleDragOver} 
                onDrop={handleDrop}
            >
                <div className={`drop-zone-inner ${isDragging ? 'dragging' : ''}`}>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        accept=".csv,.xlsx,.xls" 
                        style={{ display: 'none' }} 
                    />
                    <div className="drop-zone-content">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-cloud-arrow-up-fill text-primary mb-3" viewBox="0 0 16 16">
                            <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2zm2.354 5.146a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2z"/>
                        </svg>
                        <h5 className="text-secondary">Arraste e solte seu arquivo aqui</h5>
                        <p className="text-muted my-2">ou</p>
                        <Button variant="primary" className="btn-upload" onClick={triggerFileSelect}>
                            Selecione um arquivo
                        </Button>
                        <p className="text-muted small mt-3">Aceitamos arquivos no formato .CSV ou .XLSX.</p>
                    </div>
                </div>
            </div>
            <a href="#" className="mt-4 d-block text-center">Não sabe por onde começar? Baixe nosso modelo de planilha</a>
        </div>
    );
};

const MappingStep = ({ headers, map, setMap, onVerify, onCancel, error, setError }) => {
    const [rememberMapping, setRememberMapping] = useState(true);
    
    const handleSelectChange = (platformKey, selectedHeader) => {
        setMap(prevMap => ({ ...prevMap, [platformKey]: selectedHeader }));
    };

    return (
        <div className="mapping-screen-bg">
            <div className="mapping-container">
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                <Row className="g-5">
                    <Col lg={6}>
                        <h2 className="mapping-title">Campos da Nossa Plataforma</h2>
                        <div className="d-flex flex-column gap-3">
                            {PLATFORM_FIELDS.map(field => (
                                <div key={field.key} className="platform-field-card">
                                    <div>
                                        <p className="fw-semibold mb-1">{field.name}</p>
                                        <p className="text-muted small mb-0">{field.description}</p>
                                    </div>
                                    <OverlayTrigger placement="top" overlay={<Tooltip>{field.tooltip}</Tooltip>}>
                                        <button className="btn-icon">
                                            <QuestionIcon />
                                        </button>
                                    </OverlayTrigger>
                                </div>
                            ))}
                        </div>
                    </Col>
                    <Col lg={6}>
                        <h2 className="mapping-title">Colunas do Seu Arquivo</h2>
                        <div className="d-flex flex-column gap-4">
                            {PLATFORM_FIELDS.map(field => (
                                <div key={field.key} className="mapping-field-item">
                                    <Form.Group>
                                        <Form.Label className="small fw-medium mb-2">{field.name}</Form.Label>
                                        <div className="mapping-input-wrapper">
                                            <Form.Select 
                                                className="mapping-select" 
                                                value={map[field.key] || ''} 
                                                onChange={(e) => handleSelectChange(field.key, e.target.value)}
                                            >
                                                <option value="" disabled>Selecione uma coluna</option>
                                                {headers.map((header, index) => (
                                                    <option key={index} value={header}>{header}</option>
                                                ))}
                                                <option value="">Não informar</option>
                                            </Form.Select>
                                            {map[field.key] && <CheckmarkIcon />}
                                        </div>
                                    </Form.Group>
                                </div>
                            ))}
                        </div>
                    </Col>
                </Row>
                <div className="mapping-footer">
                    <Form.Check 
                        type="switch" 
                        id="remember-mapping-switch" 
                        label="Lembrar desta organização" 
                        checked={rememberMapping} 
                        onChange={(e) => setRememberMapping(e.target.checked)} 
                    />
                    <Button variant="primary" className="verify-button" onClick={onVerify}>
                        Verificar e pré-visualizar dados
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ValidationStep = ({ results, onConfirm, onCancel, onProductRegistered, user }) => {
    const [showProductModal, setShowProductModal] = useState(false);
    const [currentProductData, setCurrentProductData] = useState(null);
    const [productForm, setProductForm] = useState({
        nome: '',
        sku: '',
        categoria: '',
        estoque: 0,
        custoMedio: 0,
        precoVenda: 0
    });

    const handleOpenProductModal = (rowData) => {
        setCurrentProductData(rowData);
        setProductForm({
            nome: rowData.productName || '',
            sku: `SKU-${Date.now()}`,
            categoria: 'Alimentos',
            estoque: rowData.quantity || 0,
            custoMedio: rowData.unitPrice ? (rowData.unitPrice * 0.7).toFixed(2) : 0,
            precoVenda: rowData.unitPrice || 0
        });
        setShowProductModal(true);
    };

    const handleSaveProduct = () => {
        const allProducts = getItem('products') || [];
        const allInventory = getItem('inventory') || [];
        
        const productId = generateId();
        
        const newProduct = {
            id: productId,
            sku: productForm.sku,
            nome: productForm.nome,
            categoria: productForm.categoria,
            subcategoria: productForm.categoria,
            industryId: 'generic',
            precoSugerido: parseFloat(productForm.precoVenda),
            supplierIds: [],
            marca: 'Importado'
        };
        
        setItem('products', [...allProducts, newProduct]);
        
        const validade = new Date();
        validade.setDate(validade.getDate() + 90);
        
        const newInventoryItem = {
            id: generateId(),
            retailerId: user.actorId,
            productId: productId,
            nome: productForm.nome,
            sku: productForm.sku,
            categoria: productForm.categoria,
            marca: 'Importado',
            estoque: parseInt(productForm.estoque),
            custoMedio: parseFloat(productForm.custoMedio),
            precoVenda: parseFloat(productForm.precoVenda),
            precoSugerido: parseFloat(productForm.precoVenda),
            dataValidade: validade.toISOString()
        };
        
        setItem('inventory', [...allInventory, newInventoryItem]);
        
        onProductRegistered(currentProductData, newProduct, newInventoryItem);
        
        setShowProductModal(false);
    };

    const handleBulkRegister = () => {
        if (!window.confirm(`Deseja cadastrar automaticamente ${results.newProduct.length} produtos? Todos receberão valores padrão baseados na planilha.`)) {
            return;
        }

        const allProducts = getItem('products') || [];
        const allInventory = getItem('inventory') || [];
        
        const newProducts = [];
        const newInventoryItems = [];
        const productDataMap = new Map();
        
        results.newProduct.forEach((row) => {
            const productId = generateId();
            
            const newProduct = {
                id: productId,
                sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                nome: row.productName,
                categoria: 'Alimentos',
                subcategoria: 'Diversos',
                industryId: 'generic',
                precoSugerido: parseFloat(row.unitPrice) || 0,
                supplierIds: [],
                marca: 'Importado'
            };
            
            const validade = new Date();
            validade.setDate(validade.getDate() + 90);
            
            const newInventoryItem = {
                id: generateId(),
                retailerId: user.actorId,
                productId: productId,
                nome: row.productName,
                sku: newProduct.sku,
                categoria: 'Alimentos',
                marca: 'Importado',
                estoque: parseInt(row.quantity) || 0,
                custoMedio: parseFloat((parseFloat(row.unitPrice) * 0.7).toFixed(2)) || 0,
                precoVenda: parseFloat(row.unitPrice) || 0,
                precoSugerido: parseFloat(row.unitPrice) || 0,
                dataValidade: validade.toISOString()
            };
            
            newProducts.push(newProduct);
            newInventoryItems.push(newInventoryItem);
            
            const key = `${row.productName}-${row.originalRow}`;
            productDataMap.set(key, {
                row,
                product: { ...newProduct, ...newInventoryItem }
            });
        });
        
        setItem('products', [...allProducts, ...newProducts]);
        setItem('inventory', [...allInventory, ...newInventoryItems]);
        
        const updatedResults = {
            ...results,
            all: results.all.map(row => {
                const key = `${row.productName}-${row.originalRow}`;
                if (productDataMap.has(key)) {
                    const data = productDataMap.get(key);
                    return { 
                        ...row, 
                        status: 'valid', 
                        product: {
                            id: data.product.productId,
                            productId: data.product.productId,
                            sku: data.product.sku,
                            nome: data.product.nome,
                            categoria: data.product.categoria,
                            marca: data.product.marca,
                            estoque: data.product.estoque,
                            custoMedio: data.product.custoMedio,
                            precoVenda: data.product.precoVenda
                        }
                    };
                }
                return row;
            })
        };
        
        updatedResults.valid = updatedResults.all.filter(r => r.status === 'valid');
        updatedResults.newProduct = updatedResults.all.filter(r => r.status === 'newProduct');
        updatedResults.error = updatedResults.all.filter(r => r.status === 'error');
        
        onProductRegistered(null, null, null, updatedResults);
    };

    const canProceed = results.newProduct.length === 0 && results.error.length === 0;

    const renderDate = (date) => {
        if (date instanceof Date && !isNaN(date)) {
            return date.toLocaleDateString('pt-BR');
        }
        return <span className="text-danger">Data Inválida</span>;
    };

    const renderNumber = (num) => {
        if (typeof num === 'number' && !isNaN(num)) {
            return num;
        }
        return <span className="text-danger">Inválido</span>;
    };

    const renderPrice = (price) => {
        if (typeof price === 'number' && !isNaN(price)) {
            return `R$ ${price.toFixed(2)}`;
        }
        return <span className="text-danger">Inválido</span>;
    };

    return (
        <div className="validation-container">
            <div className="validation-header">
                <p className="text-muted small mb-2">Importar / Validar Dados</p>
                <h2>Validar Dados</h2>
                <p className="text-muted">Revise os dados importados, cadastre novos produtos e corrija erros antes de confirmar.</p>
            </div>

            <Card className="summary-card">
                <Card.Body>
                    <Row className="text-center">
                        <Col>
                            <p className="text-muted small mb-1">Vendas Válidas</p>
                            <h3 className="summary-count">{results.valid.length}</h3>
                        </Col>
                        <Col>
                            <p className="text-muted small mb-1">Produtos Não Cadastrados</p>
                            <h3 className="summary-count text-warning">{results.newProduct.length}</h3>
                        </Col>
                        <Col>
                            <p className="text-muted small mb-1">Erros de Dados</p>
                            <h3 className="summary-count text-danger">{results.error.length}</h3>
                        </Col>
                    </Row>
                    
                    {results.groupingStrategy === 'datetime' && (
                        <Alert variant="info" className="mt-3 mb-0">
                            <strong>ℹ️ Informação sobre Agrupamento:</strong> Não identificamos uma coluna de ID de transação. Para organizar os dados, as vendas que ocorreram exatamente no mesmo horário serão agrupadas em uma única compra. Por favor, verifique o resultado após a importação.
                        </Alert>
                    )}
                    
                    {!canProceed && (
                        <>
                            <Alert variant="warning" className="mt-3 mb-2">
                                <strong>Atenção:</strong> Cadastre todos os produtos novos antes de prosseguir com a importação.
                            </Alert>
                            {results.newProduct.length > 0 && (
                                <div className="text-center">
                                    <Button 
                                        variant="success" 
                                        onClick={handleBulkRegister}
                                        size="lg"
                                        className="me-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-lightning-fill me-2" viewBox="0 0 16 16">
                                            <path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z"/>
                                        </svg>
                                        Cadastrar Todos os {results.newProduct.length} Produtos
                                    </Button>
                                    <small className="text-muted d-block mt-2">
                                        Ou cadastre individualmente clicando no botão de cada linha
                                    </small>
                                </div>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

            <div className="validation-table-container">
                <Table hover responsive className="validation-table">
                    <thead>
                        <tr>
                            <th>Data da Venda</th>
                            <th>Produto</th>
                            <th>Quantidade</th>
                            <th>Preço Unitário</th>
                            <th>Total</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.all.map((row, index) => {
                            const total = isNaN(row.quantity) || isNaN(row.unitPrice) ? 0 : row.quantity * row.unitPrice;
                            return (
                                <tr key={index} className={`row-${row.status}`}>
                                    <td>
                                        {row.status === 'error' && (
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={
                                                    <Tooltip>
                                                        {isNaN(row.saleDate.getTime()) 
                                                            ? `Data inválida: "${row.rawDateValue}". Use formato DD/MM/AAAA`
                                                            : 'Verifique quantidade e preço'}
                                                    </Tooltip>
                                                }
                                            >
                                                <span><ErrorIcon /></span>
                                            </OverlayTrigger>
                                        )}
                                        {renderDate(row.saleDate)}
                                    </td>
                                    <td style={{ wordBreak: 'break-word' }}>
                                        {row.productName || <span className="text-muted">-</span>}
                                    </td>
                                    <td>{renderNumber(row.quantity)}</td>
                                    <td>{renderPrice(row.unitPrice)}</td>
                                    <td>{renderPrice(total)}</td>
                                    <td>
                                        {row.status === 'newProduct' && (
                                            <Button variant="primary" size="sm" onClick={() => handleOpenProductModal(row)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-circle-fill me-1" viewBox="0 0 16 16">
                                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z"/>
                                                </svg>
                                                Cadastrar Produto
                                            </Button>
                                        )}
                                        {row.status === 'valid' && (
                                            <span className="text-success small">✓ Pronto</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>
            
            <div className="validation-footer">
                <Button variant="outline-secondary" onClick={onCancel}>
                    Voltar e Corrigir o Mapeamento
                </Button>
                <Button 
                    variant="primary" 
                    onClick={onConfirm}
                    disabled={!canProceed}
                >
                    Confirmar e Importar ({results.valid.length} vendas)
                </Button>
            </div>

            <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Cadastrar Novo Produto</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info">
                        Preencha os dados do produto. Alguns campos foram preenchidos automaticamente com base na planilha.
                    </Alert>
                    <Form>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nome do Produto *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={productForm.nome}
                                        onChange={(e) => setProductForm({...productForm, nome: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>SKU *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={productForm.sku}
                                        onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Categoria *</Form.Label>
                                    <Form.Select 
                                        value={productForm.categoria}
                                        onChange={(e) => setProductForm({...productForm, categoria: e.target.value})}
                                    >
                                        <option value="Alimentos">Alimentos</option>
                                        <option value="Bebidas">Bebidas</option>
                                        <option value="Limpeza">Limpeza</option>
                                        <option value="Higiene">Higiene</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Estoque Inicial *</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        value={productForm.estoque}
                                        onChange={(e) => setProductForm({...productForm, estoque: e.target.value})}
                                        min="0"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Custo Médio *</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        step="0.01"
                                        value={productForm.custoMedio}
                                        onChange={(e) => setProductForm({...productForm, custoMedio: e.target.value})}
                                        min="0"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Preço de Venda *</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        step="0.01"
                                        value={productForm.precoVenda}
                                        onChange={(e) => setProductForm({...productForm, precoVenda: e.target.value})}
                                        min="0"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Margem de Lucro</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={productForm.custoMedio > 0 
                                            ? `${(((productForm.precoVenda - productForm.custoMedio) / productForm.custoMedio) * 100).toFixed(2)}%`
                                            : '0%'}
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowProductModal(false)}>
                        Cancelar
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSaveProduct}
                        disabled={!productForm.nome || !productForm.sku}
                    >
                        Cadastrar e Continuar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UploadPOS;