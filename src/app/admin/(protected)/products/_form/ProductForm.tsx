"use client";
import React from 'react';
import { AdminApi } from '@/services/admin';
import * as Popover from '@radix-ui/react-popover';
import { MagnifyingGlassIcon, CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import type { Product, Category } from '@/types/catalog';
import ImageUploadZone from '@/components/ImageUploadZone';

export type ProductFormProps = {
  mode: 'create' | 'edit';
  initial?: Partial<Product>;
  onSaved?: (p: Product) => void;
};

export default function ProductForm({ mode, initial, onSaved }: ProductFormProps) {
  const [title, setTitle] = React.useState(initial?.title || '');
  // slug is generated on backend as ObjectId; no manual input
  const [sku, setSku] = React.useState(initial?.sku || '');
  const [price, setPrice] = React.useState<number>(initial?.price ?? 0);
  const [salePrice, setSalePrice] = React.useState<number | ''>(initial?.salePrice ?? '');
  const [stock, setStock] = React.useState<number>(initial?.stock ?? 0);
  const [images, setImages] = React.useState<string[]>(initial?.images || []);
  const [categories, setCategories] = React.useState<string[]>(initial?.categoryIds || []);
  const [allCats, setAllCats] = React.useState<Category[]>([]);
  const [desc, setDesc] = React.useState<string>((initial as any)?.attributes?.description || '');
  const [author, setAuthor] = React.useState<string>((initial as any)?.attributes?.author || '');
  const [publisher, setPublisher] = React.useState<string>((initial as any)?.attributes?.publisher || '');
  const [year, setYear] = React.useState<number | ''>((initial as any)?.attributes?.year ?? '');
  const [language, setLanguage] = React.useState<string>((initial as any)?.attributes?.language || '');
  const [subject, setSubject] = React.useState<string>((initial as any)?.attributes?.subject || '');
  const [type, setType] = React.useState<string>((initial as any)?.attributes?.type || '');
  const [pages, setPages] = React.useState<number | ''>((initial as any)?.attributes?.pages ?? '');
  const [coverType, setCoverType] = React.useState<string>((initial as any)?.attributes?.coverType || '');
  const [series, setSeries] = React.useState<string>((initial as any)?.attributes?.series || '');
  const [format, setFormat] = React.useState<string>((initial as any)?.attributes?.format || '');
  const [isbn, setIsbn] = React.useState<string>((initial as any)?.attributes?.isbn || '');
  const [barcode, setBarcode] = React.useState<string>((initial as any)?.attributes?.barcode || '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    AdminApi.listCategories().then((list) => setAllCats(list as any)).catch(() => setAllCats([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<Product> = {
        title: title.trim(),
        // slug omitted: backend will set slug = ObjectId
        sku: sku.trim(),
        price: Number(price),
        salePrice: salePrice === '' ? undefined : Number(salePrice),
        stock: Number(stock),
        images,
        categoryIds: categories,
        attributes: {
          ...(initial as any)?.attributes,
          description: desc,
          author: author.trim() || undefined,
          publisher: publisher.trim() || undefined,
          year: year === '' ? undefined : Number(year),
          language: language.trim() || undefined,
          subject: subject.trim() || undefined,
          type: type.trim() || undefined,
          pages: pages === '' ? undefined : Number(pages),
          coverType: coverType.trim() || undefined,
          series: series.trim() || undefined,
          format: format.trim() || undefined,
          isbn: isbn.trim() || undefined,
          barcode: barcode.trim() || undefined,
        },
      } as any;
      let saved: Product;
      if (mode === 'create') saved = await AdminApi.createProduct(payload);
      else saved = await AdminApi.updateProduct(String(initial?.id), payload);
      onSaved?.(saved);
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Помилка завантаження: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.urls;
  };

  const toggleCategory = (id: string) => {
    setCategories((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const CategoryMultiSelect: React.FC<{
    options: Category[];
    value: string[];
    onChange: (next: string[]) => void;
  }> = ({ options, value, onChange }) => {
    const [open, setOpen] = React.useState(false);
    const [q, setQ] = React.useState('');
    const filtered = React.useMemo(() => {
      const s = q.trim().toLowerCase();
      if (!s) return options;
      return options.filter((o) => o.name.toLowerCase().includes(s));
    }, [q, options]);
    const toggle = (id: string) => {
      onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
    };
    const label = value.length
      ? options
          .filter((o) => value.includes(o.id))
          .map((o) => o.name)
          .slice(0, 2)
          .join(', ') + (value.length > 2 ? ` +${value.length - 2}` : '')
      : 'Виберіть категорії';
    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button type="button" style={{ ...input, display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            <ChevronDownIcon />
          </button>
        </Popover.Trigger>
        <Popover.Content align="start" sideOffset={6} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, width: 320, maxHeight: 360, overflow: 'auto', boxShadow: '0 10px 38px rgba(0,0,0,0.12), 0 10px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <MagnifyingGlassIcon />
            <input
              autoFocus
              placeholder="Пошук категорій"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ ...input, margin: 0 }}
            />
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            {filtered.map((o) => {
              const checked = value.includes(o.id);
              return (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: checked ? '#f1f5f9' : 'transparent' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(o.id)} />
                  <span style={{ flex: 1 }}>{o.name}</span>
                  {checked && <CheckIcon />}
                </label>
              );
            })}
            {!filtered.length && <div style={{ color: '#64748b', fontSize: 12, padding: 8 }}>Нічого не знайдено</div>}
          </div>
        </Popover.Content>
      </Popover.Root>
    );
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
      <div>
        <label style={label}>Назва</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required style={input} />
      </div>
      <div>
        <label style={label}>Артикул (SKU)</label>
        <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="необов’язково (за замовчуванням = slug)" style={input} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={label}>Ціна</label>
          <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} required style={input} />
        </div>
        <div>
          <label style={label}>Ціна зі знижкою</label>
          <input type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="необов’язково" style={input} />
        </div>
        <div>
          <label style={label}>Кількість на складі</label>
          <input type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} style={input} />
        </div>
      </div>

      <div>
        <label style={label}>Зображення</label>
        <ImageUploadZone 
          images={images} 
          onImagesChange={setImages}
          onUpload={uploadImages}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={label}>Автор</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>Видавництво</label>
          <input value={publisher} onChange={(e) => setPublisher(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>Рік</label>
          <input type="number" min={0} value={year} onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))} style={input} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={label}>Мова</label>
          <input value={language} onChange={(e) => setLanguage(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>Предмет</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>Тип</label>
          <input value={type} onChange={(e) => setType(e.target.value)} style={input} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={label}>Сторінок</label>
          <input type="number" min={0} value={pages} onChange={(e) => setPages(e.target.value === '' ? '' : Number(e.target.value))} style={input} />
        </div>
        <div>
          <label style={label}>Тип обкладинки</label>
          <input value={coverType} onChange={(e) => setCoverType(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>Серія</label>
          <input value={series} onChange={(e) => setSeries(e.target.value)} style={input} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={label}>Формат</label>
          <input value={format} onChange={(e) => setFormat(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>ISBN</label>
          <input value={isbn} onChange={(e) => setIsbn(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>Штрихкод</label>
          <input value={barcode} onChange={(e) => setBarcode(e.target.value)} style={input} />
        </div>
      </div>

      <div>
        <label style={label}>Категорії</label>
        <CategoryMultiSelect options={allCats} value={categories} onChange={setCategories} />
      </div>

      <div>
        <label style={label}>Опис</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} style={textarea} />
      </div>

      {error && <div style={{ color: '#ef4444', fontSize: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Збереження…' : mode === 'create' ? 'Створити' : 'Зберегти зміни'}</button>
      </div>
    </form>
  );
}

const label: React.CSSProperties = { display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' };
const textarea: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontFamily: 'inherit' };
const btnPrimary: React.CSSProperties = { padding: '10px 14px', borderRadius: 8, border: '1px solid #111827', background: '#111827', color: 'white', cursor: 'pointer' };
