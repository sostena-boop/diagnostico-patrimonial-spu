'use client';

import { useState } from 'react';

type Stage = 'origin' | 'search' | 'result' | 'steps' | 'done' | 'view';
type Step = 1 | 2 | 3 | 4 | 5 | 6;
type Origin = 'with-rip' | 'without-rip';
type Divergence = {
  id: number;
  step: Step;
  field: string;
  value: string;
  originalValue?: string;
  automatic?: boolean;
};
type Forwarding = { id: number; type: string; detail: string };
type AttachmentEntry = { id: number; name: string; category: string };

const stepNames = [
  'Dados do imóvel',
  'Situação cartorial e dominial',
  'Situação urbanística e caracterização',
  'Interferências e afetações',
  'Encaminhamentos',
  'Revisão e conclusão',
];

const documentTypes = [
  'Planta (PDF)', 'Arquivo vetorial', 'Matrícula', 'Transcrição',
  'Certidão cartorial', 'Certidão de inexistência de registro',
  'Memorial descritivo', 'Relatório técnico',
  'Despacho técnico conclusivo', 'Declaração ou ateste técnico',
  'Documento judicial', 'Foto', 'Outros documentos',
];

const interferences = [
  'Faixa de fronteira', 'Faixa de segurança',
  'Raio de 1.320 m de estabelecimento militar',
  'Faixa de 100 m da orla marítima', 'Faixa de domínio de ferrovia ou rodovia',
];

const affectations = [
  'Unidade de conservação', 'Terra indígena', 'Comunidade tradicional',
  'Território quilombola', 'Poligonal de porto organizado', 'PDISP',
  'Área de regularização fundiária / REURB', 'Operacional RFFSA',
  'Patrimônio histórico tombado', 'Outra afetação',
];

const forwardingOptions = [
  'Realizar diligências internas ou externas',
  'Elaborar ou ajustar peças técnicas',
  'Elaborar análise técnica de incorporação',
  'Solicitar complementação documental',
  'Outra providência',
];

function Field({ label, placeholder = '', disabled = false, area = false,
  required = false, value, onChange }: {
  label: string; placeholder?: string; disabled?: boolean; area?: boolean;
  required?: boolean; value?: string; onChange?: (value: string) => void;
}) {
  const control = value === undefined ? {} : { value };
  return <label className="prototype-field"><span>{label}
    {required && <b className="required-mark"> *</b>}</span>
    {area ? <textarea placeholder={placeholder} disabled={disabled} {...control}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined} /> :
      <input placeholder={placeholder} disabled={disabled} {...control}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined} />}
  </label>;
}

function Choice({ label, name, options, value, onChange }: {
  label: string; name: string; options: string[]; value?: string;
  onChange?: (value: string) => void;
}) {
  return <fieldset className="choice-group"><legend>{label}</legend><div>
    {options.map((option) => <label key={option}>
      <input type="radio" name={name}
        checked={value === undefined ? undefined : value === option}
        onChange={() => onChange?.(option)} />
      <span className="radio-dot" />{option}
    </label>)}
  </div></fieldset>;
}

function Checks({ items, selected, onChange }: {
  items: string[]; selected: string[]; onChange: (item: string) => void;
}) {
  return <div className="check-grid">{items.map((item) =>
    <label key={item} className={selected.includes(item) ? 'checked' : ''}>
      <input type="checkbox" checked={selected.includes(item)}
        onChange={() => onChange(item)} />
      <span className="checkbox-ui">{selected.includes(item) ? '✓' : ''}</span>{item}
    </label>)}</div>;
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return <div className="section-heading simple"><div><h2>{title}</h2>
    {description && <p>{description}</p>}</div></div>;
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="subsection"><h3>{title}</h3>{children}</section>;
}

function StepTitle({ step }: { step: Step }) {
  return <div className="step-heading"><p className="eyebrow">Etapa {step} de 6</p></div>;
}

function ImportedReviewField({ label, importedValue, reviewedValue, options,
  onReview }: {
  label: string; importedValue: string; reviewedValue: string; options?: string[];
  onReview: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const hasDivergence = Boolean(reviewedValue && reviewedValue !== importedValue);
  return <div className={`field-box imported-field reviewable-imported ${hasDivergence ?
    'diverged' : ''}`}>
    <div className="field-label"><label>{label}</label>
      <button type="button" className="divergence-trigger"
        aria-expanded={editing || hasDivergence} onClick={() => setEditing(true)}>
        <span aria-hidden="true">!</span>
        {hasDivergence ? 'Editar divergência' : 'Registrar divergência'}
      </button></div>
    <input value={importedValue} readOnly disabled />
    {(editing || hasDivergence) && <label className="reviewed-value">
      <span>Valor apurado no diagnóstico</span>
      {options ? <select value={reviewedValue}
        onChange={(event) => onReview(event.target.value)}>
        <option value="">Selecione o valor apurado</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select> : <input value={reviewedValue}
        placeholder="Informe o valor correto"
        onChange={(event) => onReview(event.target.value)} />}
      <span className="inline-divergence-actions">
        <button type="button" onClick={() => setEditing(false)}>Fechar</button>
        {hasDivergence && <button type="button" className="danger-link" onClick={() => {
          onReview('');
          setEditing(false);
        }}>Remover divergência</button>}
      </span>
    </label>}
  </div>;
}

function ImportedSource({ system }: { system: 'SPUnet' | 'SIAPA' }) {
  return <div className="imported-source"><strong>Origem dos dados — {system}</strong></div>;
}

function MapMock() {
  return <Subsection title="Localização geográfica"><div className="map-component">
    <div className="map-toolbar"><button type="button">● Marcar ponto</button>
      <button type="button">▱ Desenhar polígono</button></div>
    <div className="map-canvas" role="img"
      aria-label="Mapa simulado centralizado pela região do CEP">
      <span className="map-road road-one" /><span className="map-road road-two" />
      <span className="map-area" /><span className="map-pin">●</span>
      <div className="map-caption"><strong>Mapa aproximado pela localização informada</strong>
        <small>Mockup — futura integração com serviço geográfico</small></div>
    </div>
  </div></Subsection>;
}

function Attachment({ id, title, category, files, onCategory, onFiles, onRemove }: {
  id: string; title?: string; category: string; files?: AttachmentEntry[];
  onCategory: (value: string) => void; onFiles: (files: FileList | null) => void;
  onRemove: (id: number) => void;
}) {
  return <Subsection title={title ?? 'Arquivos da etapa'}><div className="attachment-picker">
    <label><span>Tipo de documento</span><select value={category}
      onChange={(event) => onCategory(event.target.value)}>
      <option value="">Selecione a tipologia</option>
      {documentTypes.map((item) => <option key={item}>{item}</option>)}
    </select></label>
    <label className={`file-button ${!category ? 'disabled' : ''}`} htmlFor={id}>
      {category ? 'Selecionar arquivo' : 'Selecione a tipologia'}</label>
    <input className="hidden-file" id={id} type="file" multiple disabled={!category}
      onChange={(event) => onFiles(event.target.files)} />
  </div>{files?.length ? <ul className="file-list">
    {files.map((file) => <li key={file.id}><span><strong>{file.category}</strong>
      <small>{file.name}</small></span><button type="button" className="danger-link"
        onClick={() => onRemove(file.id)}>Excluir</button></li>)}
  </ul> : <p className="empty-state">Nenhum arquivo anexado nesta etapa.</p>}</Subsection>;
}

function SpecificDocument({ name, label, category, answer, files, accept,
  onAnswer, onFiles, onRemove }: {
  name: string; label: string; category: string; answer: string;
  files: AttachmentEntry[]; accept?: string;
  onAnswer: (value: string) => void; onFiles: (files: FileList | null) => void;
  onRemove: (id: number) => void;
}) {
  const inputId = `specific-${name}`;
  return <div className="document-availability">
    <Choice label={label} name={name} options={['Sim', 'Não']} value={answer}
      onChange={onAnswer} />
    {answer === 'Sim' && <div className="specific-upload">
      <div><strong>{category}</strong><small>Selecione o arquivo correspondente.</small></div>
      <label className="file-button" htmlFor={inputId}>Selecionar arquivo</label>
      <input className="hidden-file" id={inputId} type="file" multiple accept={accept}
        onChange={(event) => onFiles(event.target.files)} />
      {files.length > 0 && <ul className="file-list full-row">{files.map((file) =>
        <li key={file.id}><span><strong>{file.category}</strong><small>{file.name}</small></span>
          <button type="button" className="danger-link"
            onClick={() => onRemove(file.id)}>Excluir</button></li>)}</ul>}
    </div>}
  </div>;
}

function Footer({ onBack, onSave, onNext, next = 'Salvar e continuar', disabled = false }: {
  onBack?: () => void; onSave: () => void; onNext?: () => void;
  next?: string; disabled?: boolean;
}) {
  return <footer className="actions">{onBack &&
    <button className="button ghost" onClick={onBack}>Voltar</button>}
    <span className="action-spacer" />
    <button className="button secondary" onClick={onSave}>Salvar rascunho</button>
    {onNext && <button className="button primary" disabled={disabled}
      onClick={onNext}>{next}</button>}
  </footer>;
}

export default function Home() {
  const [stage, setStage] = useState<Stage>('origin');
  const [step, setStep] = useState<Step>(1);
  const [origin, setOrigin] = useState<Origin>('with-rip');
  const [rip, setRip] = useState('0000001.23456-78');
  const [system, setSystem] = useState<'SPUnet' | 'SIAPA'>('SPUnet');
  const [manualReference, setManualReference] = useState('Nenhum');
  const [propertyType, setPropertyType] = useState('');
  const [nature, setNature] = useState('');
  const [registry, setRegistry] = useState('');
  const [ownership, setOwnership] = useState('');
  const [incorporation, setIncorporation] = useState('');
  const [subdivision, setSubdivision] = useState('');
  const [demarcation, setDemarcation] = useState('');
  const [hasInterferences, setHasInterferences] = useState('');
  const [hasAffectations, setHasAffectations] = useState('');
  const [technicalDocuments, setTechnicalDocuments] = useState<Record<string, string>>({});
  const [importedReviews, setImportedReviews] = useState<Record<string, string>>({});
  const [occurrences, setOccurrences] = useState<string[]>([]);
  const [forwardings, setForwardings] = useState<Forwarding[]>([]);
  const [draftForwardingType, setDraftForwardingType] = useState('');
  const [draftForwardingDetail, setDraftForwardingDetail] = useState('');
  const [observations, setObservations] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<Record<number, AttachmentEntry[]>>({});
  const [fileTypes, setFileTypes] = useState<Record<number, string>>({});
  const [capturedFields, setCapturedFields] = useState<
    Record<number, Record<string, string>>>({});
  const [divergences, setDivergences] = useState<Divergence[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [toast, setToast] = useState('');

  const imported = origin === 'with-rip';

  function notify(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(''), 2200);
  }
  function save() {
    window.localStorage.setItem('diagnostico-patrimonial-rascunho', JSON.stringify({
      stage, step, origin, rip, system, observations, divergences,
      occurrences, forwardings, capturedFields, files, importedReviews,
      savedAt: new Date().toISOString(),
    }));
    notify('Rascunho salvo neste navegador.');
  }
  function toggle(item: string, selected: string[], setter: (items: string[]) => void) {
    setter(selected.includes(item) ? selected.filter((value) => value !== item) :
      [...selected, item]);
  }
  function attach(stepNumber: Step, nextFiles: FileList | null, category?: string) {
    if (!nextFiles?.length) return;
    const selectedCategory = category ?? fileTypes[stepNumber] ?? '';
    const stamp = Date.now();
    const entries = Array.from(nextFiles).map((file, index) => ({
      id: stamp + index,
      name: file.name,
      category: selectedCategory || 'Sem tipologia',
    }));
    setFiles((current) => ({
      ...current, [stepNumber]: [...(current[stepNumber] ?? []), ...entries],
    }));
  }
  function removeFile(stepNumber: Step, id: number) {
    if (!window.confirm('Excluir este arquivo da etapa?')) return;
    setFiles((current) => ({
      ...current,
      [stepNumber]: (current[stepNumber] ?? []).filter((file) => file.id !== id),
    }));
  }
  function reviewImported(stepNumber: Step, field: string, originalValue: string,
    reviewedValue: string) {
    const key = `${stepNumber}:${field}`;
    setImportedReviews((current) => {
      const next = { ...current, [key]: reviewedValue };
      if (field === 'O imóvel integra loteamento?' && reviewedValue &&
        reviewedValue !== 'Sim') {
        delete next['3:Loteamento, quadra e lote'];
        delete next['3:Documento SEI da planta do loteamento'];
      }
      return next;
    });
    setDivergences((current) => {
      let withoutAutomatic = current.filter((item) =>
        !(item.automatic && item.step === stepNumber && item.field === field));
      if (field === 'O imóvel integra loteamento?' && reviewedValue &&
        reviewedValue !== 'Sim') {
        withoutAutomatic = withoutAutomatic.filter((item) => !(item.automatic &&
          item.step === 3 && ['Loteamento, quadra e lote',
            'Documento SEI da planta do loteamento'].includes(item.field)));
      }
      if (!reviewedValue.trim() || reviewedValue.trim() === originalValue) {
        return withoutAutomatic;
      }
      return [...withoutAutomatic, {
        id: Date.now(), step: stepNumber, field, value: reviewedValue.trim(),
        originalValue, automatic: true,
      }];
    });
  }
  function setOccurrenceGate(kind: 'interference' | 'affectation', value: string) {
    const catalog = kind === 'interference' ? interferences : affectations;
    const hasSelected = occurrences.some((item) => catalog.includes(item));
    if (value === 'Não' && hasSelected &&
      !window.confirm('Alterar para Não removerá as ocorrências selecionadas. Continuar?')) return;
    if (value === 'Não') {
      setOccurrences((current) => current.filter((item) => !catalog.includes(item)));
    }
    if (kind === 'interference') setHasInterferences(value);
    else setHasAffectations(value);
  }
  function setTechnicalDocument(key: string, category: string, value: string) {
    const categoryFiles = (files[3] ?? []).filter((file) => file.category === category);
    if (value === 'Não' && categoryFiles.length &&
      !window.confirm('Alterar para Não removerá os arquivos anexados. Continuar?')) return;
    if (value === 'Não') {
      setFiles((current) => ({
        ...current,
        3: (current[3] ?? []).filter((file) => file.category !== category),
      }));
    }
    setTechnicalDocuments((current) => ({ ...current, [key]: value }));
  }
  function captureStepData(stepNumber: Step) {
    const values: Record<string, string> = {};
    document.querySelectorAll<HTMLLabelElement>('.content .prototype-field')
      .forEach((label) => {
        const title = label.querySelector(':scope > span')?.textContent?.trim();
        const control = label.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          'input, textarea');
        if (title && control?.value.trim()) values[title] = control.value.trim();
      });
    document.querySelectorAll<HTMLFieldSetElement>('.content .choice-group')
      .forEach((group) => {
        const title = group.querySelector('legend')?.textContent?.trim();
        const checked = group.querySelector<HTMLInputElement>('input:checked');
        const selected = checked?.closest('label')?.textContent?.trim();
        if (title && selected) values[title] = selected;
      });
    document.querySelectorAll<HTMLElement>('.content .imported-field')
      .forEach((field) => {
        const title = field.querySelector('label')?.textContent?.trim();
        const control = field.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          'input, textarea');
        if (title && control?.value.trim()) values[title] = control.value.trim();
      });
    document.querySelectorAll<HTMLLabelElement>('.content .technical-document')
      .forEach((label) => {
        const title = label.querySelector('strong')?.textContent?.trim();
        const names = Array.from(label.querySelector<HTMLInputElement>('input')
          ?.files ?? []).map((file) => file.name).join(', ');
        if (title && names) values[title] = names;
      });
    setCapturedFields((current) => ({ ...current, [stepNumber]: values }));
  }
  function back() {
    if (stage === 'search') setStage('origin');
    else if (stage === 'result') setStage('search');
    else if (stage === 'view') setStage('done');
    else if (stage === 'done') { setStage('steps'); setStep(6); }
    else if (stage === 'steps' && step > 1) setStep((step - 1) as Step);
    else if (stage === 'steps') setStage(imported ? 'result' : 'origin');
  }
  function next() {
    captureStepData(step);
    if (step < 6) setStep((step + 1) as Step);
    else setStage('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function OriginScreen() {
    return <><div className="compact-page-heading"><h1>Seleção do imóvel</h1></div>
      <section className="form-card compact-card"><SectionTitle title="Situação cadastral"
        description="Escolha se o imóvel possui RIP. O sistema de origem será identificado automaticamente." />
        <div className="origin-grid">{[
          ['with-rip', 'Imóvel com RIP', 'Pesquisar e importar dados do SPUnet ou do SIAPA.'],
          ['without-rip', 'Imóvel sem RIP', 'Preencher o diagnóstico a partir dos documentos disponíveis.'],
        ].map(([id, title, description]) =>
          <label key={id} className={`origin-option ${origin === id ? 'selected' : ''}`}>
            <input type="radio" name="origin" checked={origin === id}
              onChange={() => setOrigin(id as Origin)} /><span className="radio-dot" />
            <span><strong>{title}</strong><small>{description}</small></span>
          </label>)}</div>
      </section><Footer onSave={save}
        onNext={() => { setStep(1); setStage(imported ? 'search' : 'steps'); }} /></>;
  }

  function SearchScreen() {
    return <><div className="compact-page-heading"><h1>Localizar imóvel pelo RIP</h1>
      <p>O cadastro de origem será identificado automaticamente.</p></div>
      <section className="form-card compact-card"><SectionTitle title="Pesquisa por RIP" />
        <div className="input-action"><input value={rip}
          onChange={(event) => setRip(event.target.value)} />
          <button className="button primary" onClick={() => {
            setSystem(rip.endsWith('9') ? 'SIAPA' : 'SPUnet');
            setStage('result');
          }}>Pesquisar</button></div>
        <small>Para este protótipo, qualquer RIP retorna o imóvel simulado.</small>
      </section><Footer onBack={back} onSave={save} /></>;
  }

  function ResultScreen() {
    return <><div className="compact-page-heading"><h1>Confirme o imóvel localizado</h1>
      <p>Confira os dados mínimos antes de importar.</p></div>
      <section className="result-card"><div className="result-topline">
        <span className="success-badge">Imóvel localizado</span>
        <span>Origem identificada: {system}</span></div>
        <div className="property-summary">
          <div><small>RIP</small><strong>{rip}</strong></div>
          <div><small>Imóvel</small><strong>Terreno da União — Centro Administrativo</strong></div>
          <div><small>Área cadastrada</small><strong>1.250,00 m²</strong></div>
        </div>
        <div className="result-location-layout"><div className="location-details">
          <h3>Localização</h3><dl>
            <div><dt>CEP</dt><dd>70040-010</dd></div>
            <div><dt>Logradouro</dt><dd>Esplanada dos Ministérios</dd></div>
            <div><dt>Número</dt><dd>Bloco K</dd></div>
            <div><dt>Complemento</dt><dd>Edifício-sede</dd></div>
            <div><dt>Bairro</dt><dd>Zona Cívico-Administrativa</dd></div>
            <div><dt>Município / UF</dt><dd>Brasília / DF</dd></div>
          </dl></div><MapMock /></div>
        <div className="inline-actions"><button className="button secondary"
          onClick={back}>Pesquisar outro RIP</button>
          <button className="button primary" onClick={() => {
            setStep(1); setStage('steps');
          }}>Confirmar e importar</button></div>
      </section></>;
  }

  function StepTail({ number }: { number: Step }) {
    return <><Attachment id={`attachment-${number}`} category={fileTypes[number] ?? ''}
        files={number === 3 ? (files[number] ?? []).filter((file) =>
          !['Planta do loteamento', 'Planta (PDF)', 'Arquivo vetorial',
            'Memorial descritivo'].includes(file.category)) : files[number]}
        onCategory={(value) =>
          setFileTypes((current) => ({ ...current, [number]: value }))}
        onFiles={(selected) => attach(number, selected)}
        onRemove={(id) => removeFile(number, id)} />
      <Subsection title="Informações complementares">
        <textarea className="general-notes" value={observations[number] ?? ''}
          onChange={(event) => setObservations((current) =>
            ({ ...current, [number]: event.target.value }))}
          placeholder="Registre informações faltantes, complementações e observações desta etapa." />
      </Subsection>
    </>;
  }

  function importedDataField(stepNumber: Step, label: string, importedValue: string,
    options?: string[]) {
    return <ImportedReviewField label={label} importedValue={importedValue}
      reviewedValue={importedReviews[`${stepNumber}:${label}`] ?? ''} options={options}
      onReview={(value) => reviewImported(stepNumber, label, importedValue, value)} />;
  }

  function StepOne() {
    return <><StepTitle step={1} /><section className="form-card">
      <SectionTitle title="Identificação e localização"
        description={imported ? 'Confira os dados recebidos do cadastro.' :
          'Preencha os dados do imóvel e sua localização.'} />
      <div className="fields-grid"><Field label="Processo SEI do imóvel"
        placeholder="00000.000000/0000-00" /></div>
      {imported ? <><ImportedSource system={system} />
        <div className="fields-grid imported-grid">
        {importedDataField(1, 'CEP', '70040-010')}
        {importedDataField(1, 'Logradouro', 'Esplanada dos Ministérios')}
        {importedDataField(1, 'Número', 'Bloco K')}
        {importedDataField(1, 'Complemento', 'Edifício-sede')}
        {importedDataField(1, 'Bairro', 'Zona Cívico-Administrativa')}
        {importedDataField(1, 'Município / UF', 'Brasília / DF')}
        {importedDataField(1, 'Coordenadas — SIRGAS 2000',
          '15°47\'23.5"S, 47°51\'42.1"W')}
        {importedDataField(1, 'Tipo de imóvel', 'Lote/Terreno')}
        {importedDataField(1, 'Natureza', 'Urbano')}
        {importedDataField(1, 'Conceituação', 'Terreno de Marinha/acrescido')}
        {importedDataField(1, 'Classificação', 'Dominial')}
        {importedDataField(1, 'Área do terreno', '1.250,00 m²')}
        {importedDataField(1, 'Área construída', '320,00 m²')}
      </div></> : <><Choice label="O imóvel possui referência em outro sistema?"
        name="reference" options={['Nenhum', 'CIDI', 'SARP']} value={manualReference}
        onChange={setManualReference} />
        {manualReference === 'CIDI' && <Field label="Número do NBP (se conhecido)" />}
        {manualReference === 'SARP' && <Field label="Número do contrato (se conhecido)" />}
        <div className="fields-grid">
          <Field label="CEP" placeholder="00000-000" />
          <Field label="Logradouro" /><Field label="Número" />
          <Field label="Complemento" /><Field label="Bairro" />
          <Field label="Município / UF" /><Field label="Latitude — SIRGAS 2000" />
          <Field label="Longitude — SIRGAS 2000" />
        </div><Subsection title="Classificação do imóvel">
          <Choice label="Tipo de imóvel" name="property" value={propertyType}
            onChange={setPropertyType} options={['Lote/Terreno', 'Gleba', 'Ilha', 'Outro']} />
          {(propertyType === 'Lote/Terreno' || propertyType === 'Gleba') &&
            <Choice label="O imóvel possui edificação?" name="building"
              options={['Sim', 'Não']} />}
          <Choice label="Natureza" name="nature" value={nature}
            onChange={setNature} options={['Urbano', 'Rural']} />
          <Choice label="Conceituação" name="concept" options={[
            'Terreno de Marinha/acrescido', 'Marginal/acrescido', 'Nacional interior',
            'Ilha costeira', 'Ilha fluvial', 'Praia', 'Mar territorial',
            'Água pública de domínio da União', 'Manguezal',
          ]} /><Choice label="Classificação" name="classification"
            options={['Dominial', 'Especial', 'Uso comum']} />
          <div className="fields-grid"><Field label="Área do terreno" />
            <Field label="Área construída" /></div>
        </Subsection></>}
      <MapMock />{StepTail({ number: 1 })}
    </section></>;
  }

  function StepTwo() {
    const hasRecord = registry === 'Matrícula' || registry === 'Transcrição';
    return <><StepTitle step={2} /><section className="form-card">
      <SectionTitle title="Situação cartorial e dominial"
        description="Reúna os dados do registro e da incorporação do imóvel." />
      <Subsection title="Situação cartorial">{imported ?
        <><ImportedSource system={system} /><div className="fields-grid imported-grid">
          {importedDataField(2, 'Registro cartorial', 'Matrícula')}
          {importedDataField(2, 'Matrícula — número, cartório e data',
            '45.678 — 1º Ofício de Registro de Imóveis — 12/03/1998')}
          {importedDataField(2, 'Matrícula individualizada', 'Sim', ['Sim', 'Não'])}
          {importedDataField(2, 'Titularidade', 'União')}
          {importedDataField(2, 'Circunscrições atuais e anteriores',
            '1º Ofício de Registro de Imóveis de Brasília/DF')}
          {importedDataField(2, 'Área do terreno no registro', '1.250,00 m²')}
          {importedDataField(2, 'Área construída averbada', '320,00 m²')}
        </div>
        </> : <><Choice label="Registro cartorial" name="registry" value={registry}
          onChange={setRegistry} options={['Matrícula', 'Transcrição',
            'Registro cartorial inexistente', 'Registro cartorial não identificado']} />
          {hasRecord && <div className="conditional-panel">
            <div className="fields-grid"><Field label="Número do registro" />
              <Field label="Cartório" /><Field label="Data do registro" />
              <Field label="Documento SEI da certidão cartorial" /></div>
            <Choice label="Registro individualizado?" name="individual"
              options={['Sim', 'Não']} />
            <Choice label="Titularidade constante do registro" name="ownership"
              value={ownership} onChange={setOwnership} options={['União', 'Outros']} />
            {ownership === 'Outros' && <Field label="Titular constante do registro"
              required placeholder="Informe o nome do titular" />}
            <Field label="Circunscrições atuais e anteriores" />
            <div className="fields-grid"><Field label="Área do terreno constante do registro" />
              <Field label="Área construída averbada no registro" /></div>
          </div>}
          {registry === 'Registro cartorial inexistente' &&
            <div className="conditional-panel"><Field
              label="Documento SEI da certidão de inexistência de registro"
              placeholder="Somente números" /></div>}
          {registry === 'Registro cartorial não identificado' &&
            <p className="warning-note">Registre as diligências realizadas nas informações complementares.</p>}
        </>}</Subsection>
      <Subsection title="Situação dominial">{imported ?
        <><div className="fields-grid imported-grid">
          {importedDataField(2, 'Forma de incorporação', 'Originalmente da União')}
        </div><p className="warning-note incorporation-warning">
          Verifique se “Originalmente da União” é a forma de incorporação correta para este imóvel.
        </p></> : <><Choice label="Forma de incorporação" name="incorporation"
          value={incorporation} onChange={setIncorporation}
          options={['Imóveis de terceiros', 'Originalmente da União', 'Por aquisição',
            'Por fracionamento/parcelamento', 'Por fusão/unificação']} />
          {incorporation === 'Por aquisição' && <Choice label="Tipo de aquisição"
            name="acquisition" options={['Compra', 'Doação', 'Desapropriação',
              'Permuta', 'RAV', 'Sucessão', 'Usucapião', 'Outro']} />}
        </>}</Subsection>
      {StepTail({ number: 2 })}
    </section></>;
  }

  function StepThree() {
    const constitutional = imported || incorporation === 'Originalmente da União';
    const effectiveSubdivision = imported ?
      (importedReviews['3:O imóvel integra loteamento?'] || 'Sim') : subdivision;
    const effectiveNature = imported ? 'Urbano' : nature;
    const subdivisionFiles = (files[3] ?? []).filter((file) =>
      file.category === 'Planta do loteamento');
    const technicalFile = (category: string) => (files[3] ?? []).filter((file) =>
      file.category === category);
    return <><StepTitle step={3} /><section className="form-card">
      <SectionTitle title="Situação urbanística e caracterização"
        description="Registre o contexto urbanístico e as peças técnicas do imóvel." />
      <Subsection title="Situação urbanística">{imported ?
        <><ImportedSource system={system} /><div className="fields-grid imported-grid">
          <ImportedReviewField label="O imóvel integra loteamento?" importedValue="Sim"
            reviewedValue={importedReviews['3:O imóvel integra loteamento?'] ?? ''}
            options={['Sim', 'Não', 'Sem informação']} onReview={(value) =>
              reviewImported(3, 'O imóvel integra loteamento?', 'Sim', value)} />
          {effectiveSubdivision === 'Sim' && <>
            <ImportedReviewField label="Loteamento, quadra e lote"
              importedValue="Plano Piloto — Quadra institucional — Lote K"
              reviewedValue={importedReviews['3:Loteamento, quadra e lote'] ?? ''}
              onReview={(value) => reviewImported(3, 'Loteamento, quadra e lote',
                'Plano Piloto — Quadra institucional — Lote K', value)} />
            <ImportedReviewField label="Documento SEI da planta do loteamento"
              importedValue="62675859"
              reviewedValue={importedReviews['3:Documento SEI da planta do loteamento'] ?? ''}
              onReview={(value) => reviewImported(3,
                'Documento SEI da planta do loteamento', '62675859', value)} />
          </>}
        </div></> : <><Choice label="O imóvel integra loteamento?" name="subdivision"
          value={subdivision} onChange={setSubdivision}
          options={['Sim', 'Não', 'Sem informação']} />
          {subdivision === 'Sim' && <div className="conditional-panel">
            <div className="fields-grid"><Field label="Nome do loteamento" />
              <Field label="Quadra ou área pública" /><Field label="Lote" />
              <Field label="Documento SEI da planta do loteamento"
                placeholder="Somente números" /></div>
          </div>}
        </>}
        {effectiveNature === 'Urbano' && <Field label="Inscrição municipal" />}
        {effectiveNature === 'Rural' && <Field label="CCIR" />}
        {!effectiveNature && <p className="warning-note">Informe a natureza do imóvel na etapa 1 para definir se este campo será Inscrição municipal ou CCIR.</p>}
        {effectiveSubdivision === 'Sim' && <div className="conditional-panel subdivision-document">
          <h4>Planta do loteamento</h4><p>Anexe o arquivo ou informe o endereço eletrônico.</p>
          <div className="specific-upload"><div><strong>Planta do loteamento</strong>
            <small>Arquivo correspondente à planta.</small></div>
            <label className="file-button" htmlFor="subdivision-plan">Selecionar arquivo</label>
            <input className="hidden-file" id="subdivision-plan" type="file"
              onChange={(event) => attach(3, event.target.files, 'Planta do loteamento')} />
            {subdivisionFiles.length > 0 && <ul className="file-list full-row">
              {subdivisionFiles.map((file) => <li key={file.id}><span>
                <strong>{file.category}</strong><small>{file.name}</small></span>
                <button type="button" className="danger-link"
                  onClick={() => removeFile(3, file.id)}>Excluir</button></li>)}</ul>}
          </div>
          <Field label="Link da planta do loteamento" placeholder="https://" />
        </div>}
        <Field label="Zoneamento municipal" area
          placeholder="Descreva o zoneamento, os usos permitidos e eventuais restrições." />
      </Subsection>
      <Subsection title="Caracterização do imóvel">
        {constitutional && <div className="conditional-panel constitutional-panel">
          <p className="context-note">Exibido porque a forma de incorporação informada na etapa 2 é “Originalmente da União”.</p>
          <Choice label="Situação da demarcação" name="demarcation" value={demarcation}
            onChange={setDemarcation} options={['Concluída', 'LPM/LMEO posicionada',
              'Iniciada', 'Não iniciada', 'Não se aplica']} />
          {demarcation === 'Iniciada' && <Field label="Estágio da demarcação" />}
          <Choice label="Identificação direta" name="direct"
            options={['Concluída', 'Iniciada', 'Não iniciada']} />
          <Field label="Demandas judiciais, recursos e outros registros" area />
        </div>}
        <div className="document-questions">
          <SpecificDocument name="has-property-plan" label="Há planta do imóvel?"
            category="Planta (PDF)" answer={technicalDocuments.plan ?? ''}
            files={technicalFile('Planta (PDF)')} accept=".pdf"
            onAnswer={(value) => setTechnicalDocument('plan', 'Planta (PDF)', value)}
            onFiles={(selected) => attach(3, selected, 'Planta (PDF)')}
            onRemove={(id) => removeFile(3, id)} />
          <SpecificDocument name="has-vector-file" label="Há arquivo vetorial?"
            category="Arquivo vetorial" answer={technicalDocuments.vector ?? ''}
            files={technicalFile('Arquivo vetorial')}
            accept=".zip,.kml,.kmz,.shp,.geojson"
            onAnswer={(value) => setTechnicalDocument('vector', 'Arquivo vetorial', value)}
            onFiles={(selected) => attach(3, selected, 'Arquivo vetorial')}
            onRemove={(id) => removeFile(3, id)} />
          <SpecificDocument name="has-memorial" label="Há memorial descritivo?"
            category="Memorial descritivo" answer={technicalDocuments.memorial ?? ''}
            files={technicalFile('Memorial descritivo')}
            onAnswer={(value) => setTechnicalDocument('memorial',
              'Memorial descritivo', value)}
            onFiles={(selected) => attach(3, selected, 'Memorial descritivo')}
            onRemove={(id) => removeFile(3, id)} />
        </div>
      </Subsection>{StepTail({ number: 3 })}
    </section></>;
  }

  function StepFour() {
    return <><StepTitle step={4} /><section className="form-card">
      <SectionTitle title="Interferências e afetações"
        description="Informe se foram identificadas interferências ou afetações." />
      <Subsection title="Interferências"><Choice label="Há interferências?"
        name="has-interferences" value={hasInterferences}
        onChange={(value) => setOccurrenceGate('interference', value)}
        options={['Sim', 'Não']} />
        {hasInterferences === 'Sim' && <Checks items={interferences}
          selected={occurrences} onChange={(item) =>
            toggle(item, occurrences, setOccurrences)} />}</Subsection>
      <Subsection title="Afetações"><Choice label="Há afetações?"
        name="has-affectations" value={hasAffectations}
        onChange={(value) => setOccurrenceGate('affectation', value)}
        options={['Sim', 'Não']} />
        {hasAffectations === 'Sim' && <><Checks items={affectations}
          selected={occurrences} onChange={(item) =>
            toggle(item, occurrences, setOccurrences)} />
          {occurrences.includes('Unidade de conservação') &&
            <Field label="Tipo de unidade de conservação" />}
          {occurrences.includes('Patrimônio histórico tombado') &&
            <Field label="Tipo de tombamento" />}
          {occurrences.includes('Outra afetação') &&
            <Field label="Especificação da outra afetação" area />}</>}
      </Subsection>{StepTail({ number: 4 })}
    </section></>;
  }

  function StepFive() {
    return <><StepTitle step={5} /><section className="form-card">
      <SectionTitle title="Encaminhamentos"
        description="Registre uma providência de cada vez." />
      <div className="forwarding-entry">
        <label><span>Providência</span><select value={draftForwardingType}
          onChange={(event) => setDraftForwardingType(event.target.value)}>
          <option value="">Selecione a providência</option>
          {forwardingOptions.map((item) => <option key={item}>{item}</option>)}
        </select></label>
        <label><span>Detalhamento</span><input value={draftForwardingDetail}
          onChange={(event) => setDraftForwardingDetail(event.target.value)}
          placeholder="Descreva o encaminhamento" /></label>
        <button type="button" className="button secondary compact" onClick={() => {
          if (!draftForwardingType || !draftForwardingDetail.trim()) {
            return notify('Selecione a providência e informe o detalhamento.');
          }
          setForwardings((current) => [...current, {
            id: Date.now(), type: draftForwardingType,
            detail: draftForwardingDetail.trim(),
          }]);
          setDraftForwardingType('');
          setDraftForwardingDetail('');
        }}>Adicionar</button>
      </div>
      <div className="forwarding-table-wrap"><table className="forwarding-table">
        <thead><tr><th>Providência</th><th>Detalhamento</th><th>Ações</th></tr></thead>
        <tbody>{forwardings.length ? forwardings.map((item) => <tr key={item.id}>
          <td>{item.type}</td><td>{item.detail}</td><td><button type="button"
            onClick={() => {
              if (!window.confirm('Excluir esta providência?')) return;
              setForwardings((current) =>
                current.filter((forwarding) => forwarding.id !== item.id));
            }}>Excluir</button></td>
        </tr>) : <tr><td colSpan={3} className="forwarding-empty">
          Nenhuma providência adicionada.</td></tr>}</tbody>
      </table></div>
      {StepTail({ number: 5 })}
    </section></>;
  }

  function StepSix() {
    const missing = ['Etapa 1 — Processo SEI do imóvel não informado'];
    if (!technicalDocuments.memorial) {
      missing.push('Etapa 3 — Disponibilidade do memorial descritivo não informada');
    }
    return <><StepTitle step={6} /><section className="form-card review-card">
      <SectionTitle title="Revisão e conclusão"
        description="Confira pendências, divergências e documentos antes de concluir." />
      <div className="review-status warning"><span>!</span><div>
        <strong>Há informações não preenchidas</strong>
        <p>Elas não impedem a conclusão nesta versão, mas serão destacadas no relatório.</p>
      </div></div>
      <Subsection title="Campos não preenchidos">{missing.map((item) =>
        <div className="review-issue missing" key={item}><span>Não informado</span>
          <strong>{item}</strong></div>)}</Subsection>
      <Subsection title="Divergências registradas">{divergences.length ?
        divergences.map((item) => <div className="review-issue divergence"
          key={item.id}><span>Etapa {item.step}</span>
          <strong>{item.field}: {item.originalValue &&
            `${item.originalValue} → `}{item.value}</strong></div>) :
        <p className="empty-state">Nenhuma divergência registrada.</p>}</Subsection>
      <Subsection title="Resumo">
        <div className="summary-list">
          <div className="summary-row"><strong>Origem</strong>
            <span>{imported ? `RIP ${rip} — ${system}` : 'Imóvel sem RIP'}</span></div>
          <div className="summary-row"><strong>Ocorrências</strong>
            <span>{occurrences.length} selecionada(s)</span></div>
          <div className="summary-row"><strong>Providências</strong>
            <span>{forwardings.length} registrada(s)</span></div>
        </div>
      </Subsection>
      <label className="acknowledgement"><input type="checkbox" checked={acknowledged}
        onChange={(event) => setAcknowledged(event.target.checked)} />
        <span>Estou ciente das informações não preenchidas e desejo concluir o diagnóstico.</span>
      </label>
    </section></>;
  }

  function DiagnosticView() {
    return <section className="diagnostic-view"><div className="view-heading">
      <div><p className="eyebrow">Diagnóstico patrimonial</p>
        <h1>Terreno da União — Centro Administrativo</h1>
        <p>{imported ? `RIP ${rip} — ${system}` : 'Imóvel sem RIP'}</p></div>
        <span className="success-badge">Concluído</span>
      </div><div className="media-overview"><div className="photo-carousel">
        <div className="photo-placeholder">Fotos do imóvel</div>
        <div className="carousel-controls"><button>‹</button><span>1 / 3</span>
          <button>›</button></div></div><MapMock /></div>
      {stepNames.slice(0, 5).map((name, index) => {
        const number = (index + 1) as Step;
        const fields = { ...(capturedFields[number] ?? {}) };
        if (number === 1) {
          fields['Situação cadastral'] = imported ? 'Imóvel com RIP' : 'Imóvel sem RIP';
          if (imported) {
            fields.RIP = rip;
            fields['Sistema de origem'] = system;
          }
        }
        const entries = Object.entries(fields);
        const stepDivergences = divergences.filter((item) => item.step === number);
        const stepFiles = files[number] ?? [];
        return <details className="diagnostic-section" key={name}>
          <summary><strong>{number}. {name}</strong>
            <span>{entries.length} informação(ões) · {stepFiles.length} arquivo(s)</span>
          </summary><div className="diagnostic-section-content">
            {entries.length ? <dl className="diagnostic-data">{entries.map(([label, value]) =>
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> :
              <p className="empty-state">Nenhum campo preenchido nesta etapa.</p>}
            {number === 4 && <div className="diagnostic-view-block">
              <strong>Interferências e afetações registradas</strong>
              <p>{occurrences.length ? occurrences.join('; ') : 'Nenhuma ocorrência selecionada.'}</p>
            </div>}
            {number === 5 && <div className="diagnostic-view-block">
              <strong>Providências registradas</strong>
              {forwardings.length ? <ul>{forwardings.map((item) =>
                <li key={item.id}><b>{item.type}</b><span>{item.detail}</span></li>)}</ul> :
                <p>Nenhuma providência registrada.</p>}
            </div>}
            {stepDivergences.length > 0 && <div className="diagnostic-view-block">
              <strong>Divergências</strong><ul>{stepDivergences.map((item) =>
                <li key={item.id}><b>{item.field}</b>
                  <span>{item.originalValue ?
                    `Importado: ${item.originalValue} · Apurado: ${item.value}` : item.value}</span>
                </li>)}</ul>
            </div>}
            <div className="diagnostic-view-block"><strong>Arquivos</strong>
              <p>{stepFiles.length ? stepFiles.map((file) =>
                `${file.category}: ${file.name}`).join('; ') : 'Nenhum arquivo anexado.'}</p>
            </div>
            <div className="diagnostic-view-block"><strong>Informações complementares</strong>
              <p>{observations[number] || 'Nenhuma informação complementar registrada.'}</p>
            </div>
          </div>
        </details>;
      })}
      <Footer onBack={back} onSave={() => notify('Relatório pronto para download.')} />
    </section>;
  }

  const stepScreen = step === 1 ? StepOne() : step === 2 ? StepTwo() :
    step === 3 ? StepThree() : step === 4 ? StepFour() :
      step === 5 ? StepFive() : StepSix();
  const canPrepareTerm = imported || incorporation === 'Originalmente da União';

  return <main className="app-shell">
    <header className="topbar"><div className="brand-mark">SPU</div>
      <div><strong>SPUnet Gestão</strong>
        <span>Módulo de Instrução de Destinações</span></div>
      <div className="prototype-chip">Protótipo funcional</div></header>
    <div className="workspace"><aside className="stepper">
      <p className="eyebrow">Diagnóstico do imóvel</p><ol>
        {stepNames.map((name, index) => {
          const number = (index + 1) as Step;
          const active = stage === 'steps' && step === number;
          const completed = stage === 'done' || stage === 'view' ||
            (stage === 'steps' && step > number);
          return <li key={name} className={`${active ? 'active' : ''} ${completed ? 'completed' : ''}`}>
            <span>{completed ? '✓' : number}</span><div><strong>{name}</strong>
              <small>{completed ? 'Concluído' : active ? 'Em preenchimento' : 'Não iniciado'}</small>
            </div></li>;
        })}</ol><div className="save-state"><span className="status-dot" />
          <div><strong>Rascunho local</strong><small>Use “Salvar rascunho” para guardar</small></div>
        </div></aside>
      <section className="content"><nav className="breadcrumb">
        Instrução de destinação <span>/</span> Diagnóstico do imóvel</nav>
        {stage === 'origin' && OriginScreen()}
        {stage === 'search' && SearchScreen()}
        {stage === 'result' && ResultScreen()}
        {stage === 'steps' && <>{stepScreen}<Footer onBack={back} onSave={save}
          onNext={next} next={step === 6 ? 'Concluir diagnóstico' : 'Salvar e continuar'}
          disabled={step === 6 && !acknowledged} /></>}
        {stage === 'done' && <section className="completion-card">
          <div className="completion-icon">✓</div><p className="eyebrow">Diagnóstico concluído</p>
          <h1>Relatório gerado com sucesso</h1>
          <p>O registro foi criado somente após a conclusão e preserva dados, lacunas,
            divergências, anexos e encaminhamentos.</p>
          <div className="completion-meta"><div><span>Registro</span>
            <strong>DPI-2026-0042</strong></div><div><span>Situação</span>
            <strong>Concluído</strong></div><div><span>Origem</span>
            <strong>{imported ? system : 'Sem RIP'}</strong></div></div>
          <div className="inline-actions centered">
            <button className="button secondary" onClick={() => setStage('view')}>
              Visualizar diagnóstico</button>
            <button className="button secondary" onClick={() => notify('Download simulado.')}>
              Baixar relatório</button>
            {canPrepareTerm && <button className="button primary"
              onClick={() => notify('Minuta do Termo de Incorporação preparada.')}>
              Preparar Termo de Incorporação</button>}
          </div></section>}
        {stage === 'view' && DiagnosticView()}
      </section></div>{toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
