// --- ARQUIVO: src/pages/retail/pos/UploadPOS.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript ---
// --- INTERFACE COMPLETAMENTE REFORMULADA ---

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth.js';
import { getInventoryByRetailer } from '../../../state/selectors.js';
import { setItem, getItem } from '../../../state/storage.js';
import { generateId } from '../../../utils/ids.js';
import { Container, Button, Alert, Table, Row, Col, Form, OverlayTrigger, Tooltip, Card, Modal, Badge } from 'react-bootstrap';
import { 
    CloudArrowUpFill, QuestionCircle, CheckCircleFill, ExclamationCircleFill, 
    ArrowRight, BoxArrowInDown, Check2All, ShieldFillCheck, XCircleFill, Tools, LightningFill, PlusCircleFill
} from 'react-bootstrap-icons';


const PLATFORM_FIELDS = [
    { key: 'product_name', name: 'Nome do Produto', description: 'O nome do produto vendido.', tooltip: 'Este campo deve conter o nome ou SKU do produto.', required: true },
    { key: 'quantity', name: 'Quantidade Vendida', description: 'A quantidade de unidades vendidas.', tooltip: 'Informe o número de unidades vendidas.', required: true },
    { key: 'unit_price', name: 'Preço de Venda (Unitário)', description: 'O preço de venda por unidade.', tooltip: 'O valor de venda para uma única unidade.', required: true },
    { key: 'sale_date', name: 'Data da Venda', description: 'A data em que a venda foi realizada.', tooltip: 'A data da transação (ex: DD/MM/AAAA HH:MM:SS).', required: true },
    { key: 'transaction_id', name: 'ID da Transação', description: 'Identificador único da venda (opcional).', tooltip: 'Número do pedido ou código do recibo para agrupar itens.', required: false },
    { key: 'unit_cost', name: 'Preço de Custo (Unitário)', description: 'Custo de aquisição do produto (opcional).', tooltip: 'Valor pago pelo produto para cálculo de lucratividade.', required: false },
    { key: 'product_sku', name: 'SKU / Código do Produto', description: 'Código identificador do produto (opcional).', tooltip: 'Código de barras ou SKU para identificação precisa.', required: false }
];

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
            
            let product = null;
            if (productSku) {
                product = inventory.find(p => p.sku === productSku);
            }
            if (!product && productNameRaw) {
                product = inventory.find(p => p.nome === productNameRaw);
            }

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
        
        const quantitiesSoldByProduct = {};
        
        validationResults.valid.forEach(item => {
            const productId = item.product?.productId || item.product?.id;
            if (productId) {
                quantitiesSoldByProduct[productId] = (quantitiesSoldByProduct[productId] || 0) + item.quantity;
            }
        });
        
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
                    onCancel={resetForNewUpload}
                />;
        }
    };
    
    if (!user) return <Container><p>Carregando...</p></Container>;
    return (
        <Container fluid>
            <Row className="justify-content-center">
                <Col lg={10} xl={10}>
                    {renderStep()}
                </Col>
            </Row>
        </Container>
    );
};

const UploadStep = ({ processFile, isDragging, setIsDragging, fileInputRef, onCancel }) => {
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
        <Card className="shadow-sm">
            <Card.Body className="p-lg-5">
                <div className="text-center">
                    <h1 className="h3 mb-1">Importar Vendas de Planilha</h1>
                    <p className="text-muted mb-4">Envie um arquivo .CSV ou .XLSX para registrar suas vendas em massa.</p>
                </div>
                
                <div className="d-flex justify-content-center">
                    <div 
                        style={{width: '100%', maxWidth: '600px'}}
                        className={`drop-zone p-5 d-flex flex-column align-items-center justify-content-center ${isDragging ? 'dragging' : ''}`}
                        onDragEnter={handleDragEnter} 
                        onDragLeave={handleDragLeave} 
                        onDragOver={handleDragOver} 
                        onDrop={handleDrop}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            accept=".csv,.xlsx,.xls" 
                            className="d-none"
                        />
                        <div className="drop-zone-icon-wrapper mb-3">
                            <CloudArrowUpFill size={32} className="drop-zone-icon" />
                        </div>
                        <h5 className="mb-2">Arraste e solte seu arquivo aqui</h5>
                        <p className="text-muted mb-3">ou</p>
                        <Button variant="primary" onClick={triggerFileSelect}>
                            <BoxArrowInDown className="me-2" />
                            Selecionar Arquivo
                        </Button>
                    </div>
                </div>

                <div className="d-flex justify-content-center mt-4">
                    <Alert variant="light" className="d-flex align-items-center text-start" style={{width: '100%', maxWidth: '600px'}}>
                        <Check2All size={24} className="text-primary me-3" />
                        <div>
                            <strong>Não sabe por onde começar?</strong>
                            <p className="mb-0 small">
                                Para garantir que seus dados sejam importados corretamente, <a href="https://drive.google.com/file/d/11Ep8aXEFYoM3Fb5w2PBidBlEuA3CX4_C/view?usp=sharing" >baixe nosso modelo de planilha</a> e preencha com suas informações.
                            </p>
                        </div>
                    </Alert>
                </div>
            </Card.Body>
        </Card>
    );
};

const MappingStep = ({ headers, map, setMap, onVerify, onCancel, error, setError }) => {
    
    const handleSelectChange = (platformKey, selectedHeader) => {
        setMap(prevMap => ({ ...prevMap, [platformKey]: selectedHeader }));
    };

    return (
        <Card className="shadow-sm">
            <Card.Body className="p-lg-5">
                 <h1 className="h3 mb-1">Mapeamento de Colunas</h1>
                <p className="text-muted mb-4">Associe as colunas do seu arquivo aos campos da nossa plataforma para garantir a importação correta.</p>

                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                <Row className="g-4">
                    {PLATFORM_FIELDS.map(field => (
                        <Col md={6} key={field.key}>
                            <Card className="h-100">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="me-2">
                                            <Card.Title as="h6">{field.name} {field.required && <span className="text-danger">*</span>}</Card.Title>
                                            <Card.Subtitle as="p" className="text-muted small">{field.description}</Card.Subtitle>
                                        </div>
                                        <OverlayTrigger placement="top" overlay={<Tooltip>{field.tooltip}</Tooltip>}>
                                            <span className="text-muted" style={{ cursor: 'help' }}><QuestionCircle /></span>
                                        </OverlayTrigger>
                                    </div>
                                     <Form.Select 
                                        className="mt-3"
                                        value={map[field.key] || ''} 
                                        onChange={(e) => handleSelectChange(field.key, e.target.value)}
                                    >
                                        <option value="" disabled>Selecione uma coluna...</option>
                                        {headers.map((header, index) => (
                                            <option key={index} value={header}>{header}</option>
                                        ))}
                                        {!field.required && <option value="">Não informar</option>}
                                    </Form.Select>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card.Body>
            <Card.Footer className="p-3 bg-light d-flex justify-content-between align-items-center">
                <Button variant="outline-secondary" onClick={onCancel}>Cancelar Importação</Button>
                <Button variant="primary" onClick={onVerify}>
                    <ShieldFillCheck className="me-2" />
                    Verificar e Validar Dados
                </Button>
            </Card.Footer>
        </Card>
    );
};

const ValidationStep = ({ results, onConfirm, onCancel, onProductRegistered, user }) => {
    const [showProductModal, setShowProductModal] = useState(false);
    const [currentProductData, setCurrentProductData] = useState(null);
    const [productForm, setProductForm] = useState({
        nome: '', sku: '', categoria: '', estoque: 0, custoMedio: 0, precoVenda: 0
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
            id: productId, sku: productForm.sku, nome: productForm.nome, categoria: productForm.categoria,
            subcategoria: productForm.categoria, industryId: 'generic', precoSugerido: parseFloat(productForm.precoVenda),
            supplierIds: [], marca: 'Importado'
        };
        setItem('products', [...allProducts, newProduct]);
        
        const validade = new Date(); validade.setDate(validade.getDate() + 90);
        
        const newInventoryItem = {
            id: generateId(), retailerId: user.actorId, productId: productId, nome: productForm.nome,
            sku: productForm.sku, categoria: productForm.categoria, marca: 'Importado',
            estoque: parseInt(productForm.estoque), custoMedio: parseFloat(productForm.custoMedio),
            precoVenda: parseFloat(productForm.precoVenda), precoSugerido: parseFloat(productForm.precoVenda),
            dataValidade: validade.toISOString()
        };
        setItem('inventory', [...allInventory, newInventoryItem]);
        onProductRegistered(currentProductData, newProduct, newInventoryItem);
        setShowProductModal(false);
    };

    const handleBulkRegister = () => {
        if (!window.confirm(`Deseja cadastrar automaticamente ${results.newProduct.length} produtos? Todos receberão valores padrão baseados na planilha.`)) return;

        const allProducts = getItem('products') || [];
        const allInventory = getItem('inventory') || [];
        const newProducts = [];
        const newInventoryItems = [];
        const productDataMap = new Map();
        
        results.newProduct.forEach((row) => {
            const productId = generateId();
            const newProduct = {
                id: productId, sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, nome: row.productName,
                categoria: 'Alimentos', subcategoria: 'Diversos', industryId: 'generic',
                precoSugerido: parseFloat(row.unitPrice) || 0, supplierIds: [], marca: 'Importado'
            };
            
            const validade = new Date(); validade.setDate(validade.getDate() + 90);
            
            const newInventoryItem = {
                id: generateId(), retailerId: user.actorId, productId: productId, nome: row.productName,
                sku: newProduct.sku, categoria: 'Alimentos', marca: 'Importado',
                estoque: parseInt(row.quantity) || 0,
                custoMedio: parseFloat((parseFloat(row.unitPrice) * 0.7).toFixed(2)) || 0,
                precoVenda: parseFloat(row.unitPrice) || 0, precoSugerido: parseFloat(row.unitPrice) || 0,
                dataValidade: validade.toISOString()
            };
            
            newProducts.push(newProduct);
            newInventoryItems.push(newInventoryItem);
            productDataMap.set(`${row.productName}-${row.originalRow}`, { row, product: { ...newProduct, ...newInventoryItem } });
        });
        
        setItem('products', [...allProducts, ...newProducts]);
        setItem('inventory', [...allInventory, ...newInventoryItems]);
        
        const updatedResults = {
            ...results,
            all: results.all.map(row => {
                const key = `${row.productName}-${row.originalRow}`;
                if (productDataMap.has(key)) {
                    const data = productDataMap.get(key);
                    return { ...row, status: 'valid', product: { ...data.product, id: data.product.productId } };
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

    return (
        <Card className="shadow-sm">
            <Card.Body className="p-lg-5">
                 <h1 className="h3 mb-1">Validação dos Dados</h1>
                <p className="text-muted mb-4">Revise, corrija e confirme os dados antes da importação final.</p>
                
                <Row className="g-3 mb-4">
                    <Col><Card body className="text-center"><p className="text-muted small mb-1">Vendas Válidas</p><h4 className="mb-0 text-success">{results.valid.length}</h4></Card></Col>
                    <Col><Card body className="text-center"><p className="text-muted small mb-1">Produtos Novos</p><h4 className="mb-0 text-warning">{results.newProduct.length}</h4></Card></Col>
                    <Col><Card body className="text-center"><p className="text-muted small mb-1">Erros</p><h4 className="mb-0 text-danger">{results.error.length}</h4></Card></Col>
                </Row>

                {!canProceed && (
                     <Alert variant="warning">
                         <Alert.Heading>Ação Necessária</Alert.Heading>
                         <p>Encontramos produtos que não estão cadastrados no seu sistema. Por favor, cadastre-os para poder importar as vendas relacionadas.</p>
                        {results.newProduct.length > 0 && (
                            <>
                                <hr/>
                                <Button variant="success" onClick={handleBulkRegister}>
                                    <LightningFill className="me-2" />
                                    Cadastrar {results.newProduct.length} Novos Produtos
                                </Button>
                            </>
                        )}
                     </Alert>
                )}
            
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table hover>
                        <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                            <tr>
                                <th>Status</th><th>Data Venda</th><th>Produto</th>
                                <th className="text-center">Qtd.</th>
                                <th className="text-end">Preço Unit.</th>
                                <th className="text-end">Total</th>
                                <th className="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.all.map((row, index) => {
                                const total = isNaN(row.quantity) || isNaN(row.unitPrice) ? 0 : row.quantity * row.unitPrice;
                                return (
                                    <tr key={index}>
                                        <td>
                                            {row.status === 'valid' && <Badge bg="success-soft" text="success" className="py-2 px-2">Válido</Badge>}
                                            {row.status === 'newProduct' && <Badge bg="warning-soft" text="warning" className="py-2 px-2">Novo Produto</Badge>}
                                            {row.status === 'error' && <Badge bg="danger-soft" text="danger" className="py-2 px-2">Erro</Badge>}
                                        </td>
                                        <td>{new Date(row.saleDate).toLocaleDateString('pt-BR')}</td>
                                        <td>{row.productName}</td>
                                        <td className="text-center">{row.quantity}</td>
                                        <td className="text-end">R$ {row.unitPrice?.toFixed(2)}</td>
                                        <td className="text-end fw-bold">R$ {total.toFixed(2)}</td>
                                        <td className="text-center">
                                            {row.status === 'newProduct' && 
                                                <Button variant="outline-primary" size="sm" onClick={() => handleOpenProductModal(row)}>
                                                    <PlusCircleFill /> Cadastrar
                                                </Button>}
                                            {row.status === 'error' && 
                                                 <OverlayTrigger placement="top" overlay={<Tooltip>Corrija na planilha e reimporte.</Tooltip>}>
                                                    <span className="text-muted" style={{cursor: 'help'}}><Tools /></span>
                                                </OverlayTrigger>
                                            }
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
             <Card.Footer className="p-3 bg-light d-flex justify-content-between align-items-center">
                <Button variant="outline-secondary" onClick={onCancel}><ArrowRight className="me-2" style={{transform: "rotate(180deg)"}}/> Voltar ao Mapeamento</Button>
                <Button variant="primary" onClick={onConfirm} disabled={!canProceed}>
                    <Check2All className="me-2"/>
                    Confirmar e Importar ({results.valid.length} vendas)
                </Button>
            </Card.Footer>

             <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>Cadastrar Novo Produto</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Alert variant="info">Preencha os dados do produto. Alguns campos foram preenchidos automaticamente.</Alert>
                    <Form>
                        <Row><Col md={8}>
                                <Form.Group className="mb-3"><Form.Label>Nome do Produto *</Form.Label>
                                    <Form.Control type="text" value={productForm.nome} onChange={(e) => setProductForm({...productForm, nome: e.target.value})} required/>
                                </Form.Group>
                            </Col><Col md={4}>
                                <Form.Group className="mb-3"><Form.Label>SKU *</Form.Label>
                                    <Form.Control type="text" value={productForm.sku} onChange={(e) => setProductForm({...productForm, sku: e.target.value})} required/>
                                </Form.Group>
                        </Col></Row>
                        <Row><Col md={4}>
                                <Form.Group className="mb-3"><Form.Label>Categoria *</Form.Label>
                                    <Form.Select value={productForm.categoria} onChange={(e) => setProductForm({...productForm, categoria: e.target.value})}>
                                        <option value="Alimentos">Alimentos</option><option value="Bebidas">Bebidas</option>
                                        <option value="Limpeza">Limpeza</option><option value="Higiene">Higiene</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col><Col md={4}>
                                <Form.Group className="mb-3"><Form.Label>Estoque Inicial *</Form.Label>
                                    <Form.Control type="number" value={productForm.estoque} onChange={(e) => setProductForm({...productForm, estoque: e.target.value})} min="0" required/>
                                </Form.Group>
                            </Col><Col md={4}>
                                <Form.Group className="mb-3"><Form.Label>Custo Médio *</Form.Label>
                                    <Form.Control type="number" step="0.01" value={productForm.custoMedio} onChange={(e) => setProductForm({...productForm, custoMedio: e.target.value})} min="0" required/>
                                </Form.Group>
                        </Col></Row>
                        <Row><Col md={6}>
                                <Form.Group className="mb-3"><Form.Label>Preço de Venda *</Form.Label>
                                    <Form.Control type="number" step="0.01" value={productForm.precoVenda} onChange={(e) => setProductForm({...productForm, precoVenda: e.target.value})} min="0" required/>
                                </Form.Group>
                            </Col><Col md={6}>
                                <Form.Group className="mb-3"><Form.Label>Margem de Lucro</Form.Label>
                                    <Form.Control type="text" value={productForm.custoMedio > 0 ? `${(((productForm.precoVenda - productForm.custoMedio) / productForm.custoMedio) * 100).toFixed(2)}%` : '0%'} disabled/>
                                </Form.Group>
                        </Col></Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowProductModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSaveProduct} disabled={!productForm.nome || !productForm.sku}>
                        Cadastrar e Continuar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
};

export default UploadPOS;

