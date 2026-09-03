'use client';

import { useMemo, useState } from 'react';

type Stage = 'regime' | 'origin' | 'search' | 'result' | 'steps' | 'done' | 'view';
type Step = 1 | 2 | 3 | 4 | 5 | 6;
type Origin = 'with-rip' | 'without-rip';
type Divergence = { step: Step; field: string; value: string };
type Forwarding = { id: number; type: string; detail: string };

const stepNames = [
  'Dados do imóvel',
  'Situação cartorial e dominial',
  'Situação urbanística e caracterização',
  'Interferências e afetações',
  'Encaminhamentos',
  'Revisão e conclusão',
];

const terminalRegimes = `Dação em pagamento
Declaração de Interesse do Serviço Publico
Doação
Integralização de cotas em Fundo de Investimento Imobiliário
Investidura
Permuta
Remição do foro
Venda
Transferência de propriedade para fins de Reurb-S
Aforamento gratuito
Aforamento oneroso
Concessão de Direito Real de Laje Gratuita
Concessão de Direito Real de Laje Onerosa
Concessão de Direito Real de Uso Gratuita
Concessão de Direito Real de Uso Onerosa
Concessão de Direito de Superfície Gratuita
Concessão de Direito de Superfície Onerosa
Concessão de uso especial para fins de moradia (CUEM)
Promessa de compra e venda
Transferência de direito real de uso para Reurb-S
Arrendamento
Cessão de uso gratuita
Cessão de uso onerosa
Cessão de uso em condições especiais
Cessão de uso provisória
Locação para terceiros
Permissão de uso para fins residenciais
Transferência gratuita da posse
Transferência onerosa da posse
Acordo de Cooperação Técnica para Regularização Fundiária Urbana (ACT-Reurb)
Entrega
Entrega provisória
Guarda Provisória
Transferência de gestão de orlas e praias
Autorização de obras
Autorização de passagem gratuita
Autorização de passagem onerosa
Autorização de uso para fins comerciais
Autorização de uso sustentável
Inscrição de ocupação
Permissão de uso para eventos de curta duração`.split('\n')
  .sort((a, b) => a.localeCompare(b, 'pt-BR'));

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

function Field({ label, placeholder = '', disabled = false, area = false }: {
  label: string; placeholder?: string; disabled?: boolean; area?: boolean;
}) {
  return <label className="prototype-field"><span>{label}</span>
    {area ? <textarea placeholder={placeholder} disabled={disabled} /> :
      <input placeholder={placeholder} disabled={disabled} />}
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

function ImportedField({ label, value, large = false }: {
  label: string; value: string; large?: boolean;
}) {
  return <div className={`field-box imported-field ${large ? 'large-field' : ''}`}>
    <div className="field-label"><label>{label}</label></div>
    {large ? <textarea value={value} readOnly disabled /> :
      <input value={value} readOnly disabled />}
  </div>;
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

function Attachment({ id, title, category, files, onCategory, onFiles }: {
  id: string; title?: string; category: string; files?: string[];
  onCategory: (value: string) => void; onFiles: (files: FileList | null) => void;
}) {
  return <Subsection title={title ?? 'Arquivos da etapa'}><div className="attachment-picker">
    <label><span>Tipo de documento</span><select value={category}
      onChange={(event) => onCategory(event.target.value)}>
      <option value="">Selecione a tipologia</option>
      {documentTypes.map((item) => <option key={item}>{item}</option>)}
    </select></label>
    <label className="file-button" htmlFor={id}>Selecionar arquivo</label>
    <input className="hidden-file" id={id} type="file" multiple
      onChange={(event) => onFiles(event.target.files)} />
  </div>{files?.length ? <ul className="file-list">
    {files.map((file) => <li key={file}><strong>{category || 'Sem tipologia'}</strong>
      <span>{file}</span></li>)}
  </ul> : <p className="empty-state">Nenhum arquivo anexado nesta etapa.</p>}</Subsection>;
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
  const [stage, setStage] = useState<Stage>('regime');
  const [step, setStep] = useState<Step>(1);
  const [regime, setRegime] = useState('');
  const [query, setQuery] = useState('');
  const [regimeOpen, setRegimeOpen] = useState(false);
  const [origin, setOrigin] = useState<Origin>('with-rip');
  const [rip, setRip] = useState('0000001.23456-78');
  const [system, setSystem] = useState<'SPUnet' | 'SIAPA'>('SPUnet');
  const [manualReference, setManualReference] = useState('Nenhum');
  const [propertyType, setPropertyType] = useState('');
  const [registry, setRegistry] = useState('');
  const [incorporation, setIncorporation] = useState('');
  const [subdivision, setSubdivision] = useState('');
  const [demarcation, setDemarcation] = useState('');
  const [occurrences, setOccurrences] = useState<string[]>([]);
  const [forwardings, setForwardings] = useState<Forwarding[]>([]);
  const [draftForwardingType, setDraftForwardingType] = useState('');
  const [draftForwardingDetail, setDraftForwardingDetail] = useState('');
  const [observations, setObservations] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<Record<number, string[]>>({});
  const [fileTypes, setFileTypes] = useState<Record<number, string>>({});
  const [capturedFields, setCapturedFields] = useState<
    Record<number, Record<string, string>>>({});
  const [divergences, setDivergences] = useState<Divergence[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [toast, setToast] = useState('');
  const [draftField, setDraftField] = useState('');
  const [draftValue, setDraftValue] = useState('');

  const imported = origin === 'with-rip';
  const filteredRegimes = useMemo(() => terminalRegimes.filter((item) =>
    item.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))), [query]);

  function notify(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(''), 2200);
  }
  function save() {
    window.localStorage.setItem('diagnostico-patrimonial-rascunho', JSON.stringify({
      stage, step, regime, origin, rip, system, observations, divergences,
      occurrences, forwardings, capturedFields, savedAt: new Date().toISOString(),
    }));
    notify('Rascunho salvo neste navegador.');
  }
  function toggle(item: string, selected: string[], setter: (items: string[]) => void) {
    setter(selected.includes(item) ? selected.filter((value) => value !== item) :
      [...selected, item]);
  }
  function attach(stepNumber: Step, nextFiles: FileList | null) {
    if (nextFiles) setFiles((current) => ({
      ...current, [stepNumber]: Array.from(nextFiles).map((file) => file.name),
    }));
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
    if (stage === 'origin') setStage('regime');
    else if (stage === 'search') setStage('origin');
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

  function RegimeScreen() {
    return <><div className="compact-page-heading"><h1>Regime de destinação</h1>
      <p>Selecione a modalidade específica que orientará este diagnóstico.</p></div>
      <section className="form-card compact-card">
        <SectionTitle title="Qual é o regime de destinação a ser aplicado ao imóvel?" />
        <div className="regime-combobox">
          <input className="regime-search" role="combobox" aria-autocomplete="list"
            aria-expanded={regimeOpen} aria-controls="regime-options" value={query}
            onFocus={() => {
              if (query === regime) setQuery('');
              setRegimeOpen(true);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setRegime('');
              setRegimeOpen(true);
            }}
            onBlur={() => window.setTimeout(() => {
              setRegimeOpen(false);
              if (regime) setQuery(regime);
            }, 120)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setRegimeOpen(false);
                if (regime) setQuery(regime);
              }
            }}
            placeholder="Digite para pesquisar ou selecionar" />
          {regimeOpen && <div id="regime-options" className="regime-list floating"
            role="listbox">
            {filteredRegimes.length ? filteredRegimes.map((item) =>
              <button type="button" role="option" aria-selected={regime === item}
                key={item} className={regime === item ? 'selected' : ''}
                onMouseDown={(event) => {
                  event.preventDefault();
                  setRegime(item);
                  setQuery(item);
                  setRegimeOpen(false);
                }}>{item}</button>) :
              <p className="regime-empty">Nenhum regime encontrado.</p>}
          </div>}
        </div>
      </section><Footer onSave={save} onNext={() => setStage('origin')}
        disabled={!regime} /></>;
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
      </section><Footer onBack={back} onSave={save}
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
          <div><small>Matrícula</small><strong>45.678</strong></div>
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

  function StepTail({ number, divergenceFields }: {
    number: Step; divergenceFields?: string[];
  }) {
    return <>{imported && divergenceFields && <Subsection title="Divergências desta etapa">
      <p className="field-help">Registre o campo e o valor apurado sem alterar o dado cadastral.</p>
      <div className="divergence-entry"><select value={draftField}
        onChange={(event) => setDraftField(event.target.value)}>
        <option value="">Selecione o campo</option>
        {divergenceFields.map((field) => <option key={field}>{field}</option>)}
      </select><input value={draftValue} onChange={(event) => setDraftValue(event.target.value)}
        placeholder="Valor apurado" /><button className="button secondary compact"
        onClick={() => {
          if (!draftField || !draftValue) return notify('Informe o campo e o valor apurado.');
          setDivergences((current) => [...current,
            { step: number, field: draftField, value: draftValue }]);
          setDraftField(''); setDraftValue('');
        }}>Adicionar</button></div>
      {divergences.filter((item) => item.step === number).map((item, index) =>
        <div className="divergence-chip" key={`${item.field}-${index}`}>
          <strong>{item.field}</strong><span>{item.value}</span></div>)}
    </Subsection>}
      <Attachment id={`attachment-${number}`} category={fileTypes[number] ?? ''}
        files={files[number]} onCategory={(value) =>
          setFileTypes((current) => ({ ...current, [number]: value }))}
        onFiles={(selected) => attach(number, selected)} />
      <Subsection title="Informações complementares">
        <textarea className="general-notes" value={observations[number] ?? ''}
          onChange={(event) => setObservations((current) =>
            ({ ...current, [number]: event.target.value }))}
          placeholder="Registre informações faltantes, complementações e observações desta etapa." />
      </Subsection>
    </>;
  }

  function StepOne() {
    const fields = ['CEP', 'Logradouro', 'Número', 'Complemento', 'Bairro',
      'Município / UF', 'Coordenadas', 'Tipo de imóvel', 'Natureza',
      'Conceituação', 'Classificação', 'Área do terreno', 'Área construída'];
    return <><StepTitle step={1} /><section className="form-card">
      <SectionTitle title="Identificação e localização"
        description={imported ? 'Confira os dados recebidos do cadastro.' :
          'Preencha os dados do imóvel e sua localização.'} />
      <div className="fields-grid"><Field label="Processo SEI do imóvel"
        placeholder="00000.000000/0000-00" /></div>
      {imported ? <div className="fields-grid imported-grid">
        <ImportedField label="CEP" value="70040-010" />
        <ImportedField label="Logradouro" value="Esplanada dos Ministérios" />
        <ImportedField label="Número" value="Bloco K" />
        <ImportedField label="Complemento" value="Edifício-sede" />
        <ImportedField label="Bairro" value="Zona Cívico-Administrativa" />
        <ImportedField label="Município / UF" value="Brasília / DF" />
        <ImportedField label="Coordenadas — SIRGAS 2000"
          value={'15°47\'23.5"S, 47°51\'42.1"W'} />
        <ImportedField label="Tipo de imóvel" value="Lote/Terreno" />
        <ImportedField label="Natureza" value="Urbano" />
        <ImportedField label="Conceituação" value="Terreno de Marinha/acrescido" />
        <ImportedField label="Classificação" value="Dominial" />
        <ImportedField label="Área do terreno" value="1.250,00 m²" />
        <ImportedField label="Área construída" value="320,00 m²" />
      </div> : <><Choice label="O imóvel possui referência em outro sistema?"
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
          <Choice label="Natureza" name="nature" options={['Urbano', 'Rural']} />
          <Choice label="Conceituação" name="concept" options={[
            'Terreno de Marinha/acrescido', 'Marginal/acrescido', 'Nacional interior',
            'Ilha costeira', 'Ilha fluvial', 'Praia', 'Mar territorial',
            'Água pública de domínio da União', 'Manguezal',
          ]} /><Choice label="Classificação" name="classification"
            options={['Dominial', 'Especial', 'Uso comum']} />
          <div className="fields-grid"><Field label="Área do terreno" />
            <Field label="Área construída" /></div>
        </Subsection></>}
      <MapMock />{StepTail({ number: 1, divergenceFields: fields })}
    </section></>;
  }

  function StepTwo() {
    const hasRecord = registry === 'Matrícula' || registry === 'Transcrição';
    const fields = ['Registro cartorial', 'Matrícula ou transcrição', 'Titularidade',
      'Área do terreno no registro', 'Área construída averbada', 'Forma de incorporação'];
    return <><StepTitle step={2} /><section className="form-card">
      <SectionTitle title="Situação cartorial e dominial"
        description="Reúna os dados do registro e da incorporação do imóvel." />
      <Subsection title="Situação cartorial">{imported ?
        <><div className="fields-grid imported-grid">
          <ImportedField label="Registro cartorial" value="Matrícula" />
          <ImportedField label="Matrícula — número, cartório e data"
            value="45.678 — 1º Ofício de Registro de Imóveis — 12/03/1998" />
          <ImportedField label="Matrícula individualizada" value="Sim" />
          <ImportedField label="Titularidade" value="União" />
          <ImportedField label="Circunscrições atuais e anteriores"
            value="1º Ofício de Registro de Imóveis de Brasília/DF" />
          <ImportedField label="Área do terreno no registro" value="1.250,00 m²" />
          <ImportedField label="Área construída averbada" value="320,00 m²" />
        </div><div className="area-comparison"><strong>Comparação de áreas</strong>
          <span>Cadastro: 1.250,00 m²</span><span>Registro: 1.250,00 m²</span>
          <em>Sem diferença identificada</em></div>
          <Field label="Outros registros relacionados" area
            placeholder="Informe matrículas ou transcrições anteriores, originárias ou relacionadas." />
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
              options={['União', 'Outros']} />
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
          <Field label="Outros registros relacionados" area
            placeholder="Informe a cadeia cartorial conhecida." />
        </>}</Subsection>
      <Subsection title="Situação dominial">{imported ?
        <div className="fields-grid imported-grid">
          <ImportedField label="Forma de incorporação" value="Originalmente da União" />
        </div> : <><Choice label="Forma de incorporação" name="incorporation"
          value={incorporation} onChange={setIncorporation}
          options={['Imóveis de terceiros', 'Originalmente da União', 'Por aquisição',
            'Por fracionamento/parcelamento', 'Por fusão/unificação']} />
          {incorporation === 'Por aquisição' && <Choice label="Tipo de aquisição"
            name="acquisition" options={['Compra', 'Doação', 'Desapropriação',
              'Permuta', 'RAV', 'Sucessão', 'Usucapião', 'Outro']} />}
        </>}</Subsection>
      {StepTail({ number: 2, divergenceFields: fields })}
    </section></>;
  }

  function StepThree() {
    const constitutional = imported || incorporation === 'Originalmente da União';
    const fields = ['Loteamento', 'Planta do loteamento',
      'Demarcação', 'Identificação direta', 'Memorial descritivo'];
    return <><StepTitle step={3} /><section className="form-card">
      <SectionTitle title="Situação urbanística e caracterização"
        description="Registre o contexto urbanístico e as peças técnicas do imóvel." />
      <Subsection title="Situação urbanística">{imported ?
        <div className="fields-grid imported-grid">
          <ImportedField label="O imóvel integra loteamento?" value="Sim" />
          <ImportedField label="Loteamento, quadra e lote"
            value="Plano Piloto — Quadra institucional — Lote K" />
          <ImportedField label="Documento SEI da planta do loteamento" value="62675859" />
        </div> : <><Choice label="O imóvel integra loteamento?" name="subdivision"
          value={subdivision} onChange={setSubdivision}
          options={['Sim', 'Não', 'Sem informação']} />
          {subdivision === 'Sim' && <div className="conditional-panel">
            <div className="fields-grid"><Field label="Nome do loteamento" />
              <Field label="Quadra ou área pública" /><Field label="Lote" />
              <Field label="Documento SEI da planta do loteamento"
                placeholder="Somente números" /></div>
          </div>}
        </>}
        <Field label="Zoneamento municipal" area
          placeholder="Descreva o zoneamento, os usos permitidos e eventuais restrições." />
      </Subsection>
      <Subsection title="Caracterização do imóvel">
        {constitutional && <div className="conditional-panel constitutional-panel">
          <p className="context-note">Exibido porque a forma de incorporação informada na etapa 2 é “Originalmente da União”.</p>
          <Choice label="Situação da demarcação" name="demarcation" value={demarcation}
            onChange={setDemarcation} options={['Concluída', 'LPM/LMEO posicionada',
              'Iniciada', 'Não iniciada']} />
          {demarcation === 'Iniciada' && <Field label="Estágio da demarcação" />}
          <Choice label="Identificação direta" name="direct"
            options={['Concluída', 'Iniciada', 'Não iniciada']} />
          <Field label="Demandas judiciais, recursos e outros registros" area />
        </div>}
        <div className="technical-doc-grid">
          <label className="technical-document"><strong>Planta do imóvel — PDF</strong>
            <input type="file" accept=".pdf" /></label>
          <label className="technical-document"><strong>Arquivo vetorial</strong>
            <input type="file" accept=".zip,.kml,.kmz,.shp,.geojson" /></label>
        </div>
        <Field label="Memorial descritivo" area
          placeholder="Descreva o memorial ou indique o documento correspondente." />
      </Subsection>{StepTail({ number: 3, divergenceFields: fields })}
    </section></>;
  }

  function StepFour() {
    return <><StepTitle step={4} /><section className="form-card">
      <SectionTitle title="Interferências e afetações"
        description="Registre cada ocorrência e o resultado da análise realizada." />
      <Subsection title="Interferências"><Checks items={interferences}
        selected={occurrences} onChange={(item) =>
          toggle(item, occurrences, setOccurrences)} /></Subsection>
      <Subsection title="Afetações"><Checks items={affectations}
        selected={occurrences} onChange={(item) =>
          toggle(item, occurrences, setOccurrences)} />
        {occurrences.includes('Unidade de conservação') &&
          <Field label="Tipo de unidade de conservação" />}
        {occurrences.includes('Patrimônio histórico tombado') &&
          <Field label="Tipo de tombamento" />}
        {occurrences.includes('Outra afetação') &&
          <Field label="Especificação da outra afetação" area />}
      </Subsection>
      <Subsection title="Análise"><Choice label="Resultado da verificação"
        name="analysis" options={['Não se aplica', 'Não identificada',
          'Identificada — sem impedimento', 'Identificada — requer providência',
          'Análise pendente']} />
        <Field label="Detalhamento das ocorrências e fontes consultadas" area />
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
            onClick={() => setForwardings((current) =>
              current.filter((forwarding) => forwarding.id !== item.id))}>Excluir</button></td>
        </tr>) : <tr><td colSpan={3} className="forwarding-empty">
          Nenhuma providência adicionada.</td></tr>}</tbody>
      </table></div>
      {StepTail({ number: 5 })}
    </section></>;
  }

  function StepSix() {
    const missing = [
      'Etapa 1 — Processo SEI do imóvel não informado',
      'Etapa 3 — Referência do memorial descritivo não informada',
    ];
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
        divergences.map((item, index) => <div className="review-issue divergence"
          key={`${item.field}-${index}`}><span>Etapa {item.step}</span>
          <strong>{item.field}: {item.value}</strong></div>) :
        <p className="empty-state">Nenhuma divergência registrada.</p>}</Subsection>
      <Subsection title="Resumo">
        <div className="summary-list">
          <div className="summary-row"><strong>Regime</strong><span>{regime}</span></div>
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
        <p>{regime}</p></div><span className="success-badge">Concluído</span>
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
              <strong>Divergências</strong><ul>{stepDivergences.map((item, itemIndex) =>
                <li key={`${item.field}-${itemIndex}`}><b>{item.field}</b>
                  <span>{item.value}</span></li>)}</ul>
            </div>}
            <div className="diagnostic-view-block"><strong>Arquivos</strong>
              <p>{stepFiles.length ? stepFiles.join('; ') : 'Nenhum arquivo anexado.'}</p>
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
        {stage === 'regime' && RegimeScreen()}
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
            <strong>Concluído</strong></div></div>
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
