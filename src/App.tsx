import React, { useState, useEffect, useMemo } from 'react';
import { Product } from './types';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Kaos Kata: Kerja Keras Bagai Kuda",
    buy_url: "https://shopee.co.id",
    category: "Kaos Kata-Kata",
    price: "Rp 89.000",
    description: "Bahan katun combed 30s premium, adem dan menyerap keringat. Sablon DTF presisi tidak mudah retak.",
    badge: "Terlaris",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
    alt: "Kaos Kata Kerja Keras Bagai Kuda",
    created_at: 1712000000
  },
  {
    id: "prod-2",
    name: "Kaos Minimalis: Santai Tapi Pasti",
    buy_url: "https://tokopedia.com",
    category: "Kaos Kata-Kata",
    price: "Rp 95.000",
    description: "Desain tipografi minimalis modern dengan aksen warna lime. Cocok untuk hangout kasual dan daily wear.",
    badge: "Pilihan Editor",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80",
    alt: "Kaos Santai Tapi Pasti",
    created_at: 1711900000
  },
  {
    id: "prod-3",
    name: "Graphic Tee: Urban Street Character",
    buy_url: "https://shopee.co.id",
    category: "Graphic Tee",
    price: "Rp 115.000",
    description: "Ilustrasi streetwear eksklusif dengan warna tajam. Menggunakan bahan heavy cotton 24s berpotongan oversized.",
    badge: "Terbaru",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
    alt: "Graphic Tee Urban Street",
    created_at: 1711800000
  },
  {
    id: "prod-4",
    name: "Kaos Humor: Butuh Liburan Bukan Solusi",
    buy_url: "https://tokopedia.com",
    category: "Kaos Humor",
    price: "Rp 89.000",
    description: "Kata-kata satir lucu seputar dunia kerja dan rutinitas. Pilihan pas untuk hadiah kawan sekantor.",
    badge: "Viral",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80",
    alt: "Kaos Humor Butuh Liburan",
    created_at: 1711700000
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<'catalog' | 'admin'>(() => {
    return window.location.hash === '#admin' || window.location.pathname === '/admin'
      ? 'admin'
      : 'catalog';
  });

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Admin state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('kaoscustom_auth') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [notice, setNotice] = useState<string>('');

  // Admin form state
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Kaos Kata-Kata');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formBuyUrl, setFormBuyUrl] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formBadge, setFormBadge] = useState<string>('');
  const [formAlt, setFormAlt] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      } else if (window.location.hash === '#produk' || window.location.hash === '#tentang' || window.location.hash === '') {
        setCurrentView('catalog');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch products with localStorage fallback for static Cloudflare deployments
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          localStorage.setItem('kaoscustom_products', JSON.stringify(data));
          return;
        }
      }
    } catch {
      // API not reachable (e.g. static Cloudflare Pages/Worker deployment)
    }

    // Fallback to local storage or initial products
    try {
      const cached = localStorage.getItem('kaoscustom_products');
      if (cached) {
        setProducts(JSON.parse(cached));
      } else {
        setProducts(INITIAL_PRODUCTS);
        localStorage.setItem('kaoscustom_products', JSON.stringify(INITIAL_PRODUCTS));
      }
    } catch {
      setProducts(INITIAL_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  // Check admin session with fallback
  const checkAdminAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setIsAdminAuthenticated(true);
          localStorage.setItem('kaoscustom_auth', 'true');
          return;
        }
      }
    } catch {
      // offline / static fallback
    }
  };

  useEffect(() => {
    fetchProducts();
    checkAdminAuth();
  }, []);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const cats = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [products]);

  // Filtered products for catalog
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
      const matchQ = !q || text.includes(q);
      const matchCat = !activeCategory || p.category === activeCategory;
      return matchQ && matchCat;
    });
  }, [products, searchQuery, activeCategory]);

  // Admin login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsAdminAuthenticated(true);
          localStorage.setItem('kaoscustom_auth', 'true');
          setAdminPassword('');
          setNotice('Berhasil masuk ke area admin.');
          return;
        }
      }
    } catch {
      // fallback for static hosting
    }

    // Static mode auth verification
    if (adminUsername === 'admin' && adminPassword === 'GantiPasswordKuat-2026!') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('kaoscustom_auth', 'true');
      setAdminPassword('');
      setNotice('Berhasil masuk ke area admin.');
    } else {
      setLoginError('Username atau password salah.');
    }
  };

  // Admin logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setIsAdminAuthenticated(false);
    localStorage.removeItem('kaoscustom_auth');
    setNotice('');
    window.location.hash = '';
    setCurrentView('catalog');
  };

  // Start edit product
  const startEdit = (p: Product) => {
    setEditId(p.id);
    setFormName(p.name);
    setFormCategory(p.category || 'Kaos Kata-Kata');
    setFormPrice(p.price || '');
    setFormBuyUrl(p.buy_url);
    setFormImageUrl(p.image || '');
    setFormDescription(p.description || '');
    setFormBadge(p.badge || '');
    setFormAlt(p.alt || p.name);
    setSelectedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setFormName('');
    setFormCategory('Kaos Kata-Kata');
    setFormPrice('');
    setFormBuyUrl('');
    setFormImageUrl('');
    setFormDescription('');
    setFormBadge('');
    setFormAlt('');
    setSelectedFile(null);
  };

  // Save product (add or update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('');
    setIsSubmitting(true);

    try {
      let finalImageUrl = formImageUrl.trim();

      // If user uploaded a new image file, try uploading to server or convert to data URL
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('image_file', selectedFile);

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            finalImageUrl = uploadData.url;
          } else {
            // Read as data URL for client persistence
            finalImageUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(selectedFile);
            });
          }
        } catch {
          finalImageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(selectedFile);
          });
        }
      }

      if (!finalImageUrl) {
        setNotice('Pilih file gambar atau masukkan URL gambar.');
        setIsSubmitting(false);
        return;
      }

      const payload: Product = {
        id: editId || 'prod-' + Date.now().toString(36),
        name: formName.trim(),
        buy_url: formBuyUrl.trim(),
        category: formCategory.trim() || 'Kaos Custom',
        price: formPrice.trim(),
        description: formDescription.trim(),
        badge: formBadge.trim(),
        image: finalImageUrl,
        alt: (formAlt || formName).trim(),
        created_at: Math.floor(Date.now() / 1000),
      };

      // Try server API
      let serverSaved = false;
      try {
        const url = editId ? `/api/products/${editId}` : '/api/products';
        const method = editId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          serverSaved = true;
          await fetchProducts();
        }
      } catch {
        // server offline
      }

      // If server didn't handle it, update state & localStorage
      if (!serverSaved) {
        let updated: Product[];
        if (editId) {
          updated = products.map((p) => (p.id === editId ? payload : p));
        } else {
          updated = [payload, ...products];
        }
        setProducts(updated);
        localStorage.setItem('kaoscustom_products', JSON.stringify(updated));
      }

      setNotice(editId ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan ke katalog.');
      cancelEdit();
    } catch {
      setNotice('Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus produk ini dari katalog?')) {
      return;
    }

    try {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
      } catch {
        // ignore if offline
      }

      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      localStorage.setItem('kaoscustom_products', JSON.stringify(updated));
      setNotice('Produk berhasil dihapus.');
      if (editId === id) cancelEdit();
    } catch {
      setNotice('Terjadi kesalahan saat menghapus produk.');
    }
  };

  const navigateTo = (view: 'catalog' | 'admin', hash = '') => {
    setCurrentView(view);
    window.location.hash = hash;
  };

  // ADMIN VIEW
  if (currentView === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <div className="admin">
          <form className="login" onSubmit={handleLogin}>
            <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigateTo('catalog'); }}>
              <img src="/assets/logo.svg" alt="" />
              <span>kaos-custom<span className="muted">.my.id</span></span>
            </a>
            <small>AREA ADMIN</small>
            <h1>Selamat datang.</h1>
            <p>Masuk untuk mengelola produk dan link pembelian.</p>
            {loginError && <p className="error">{loginError}</p>}
            <label>
              Username
              <input
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                placeholder="GantiPasswordKuat-2026!"
              />
            </label>
            <button className="btn" type="submit">Masuk Admin ↗</button>
            <a href="/" onClick={(e) => { e.preventDefault(); navigateTo('catalog'); }}>
              ← Kembali ke website
            </a>
          </form>
        </div>
      );
    }

    // Authenticated Admin Dashboard
    return (
      <div className="admin">
        <header className="admintop">
          <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigateTo('catalog'); }}>
            <img src="/assets/logo.svg" alt="" />
            <span>kaos-custom<span className="muted">.my.id</span></span>
          </a>
          <div>
            <a href="/" onClick={(e) => { e.preventDefault(); navigateTo('catalog'); }}>
              Lihat Website ↗
            </a>
            {'　'}
            <a href="#logout" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
              Keluar
            </a>
          </div>
        </header>

        <main className="dash">
          <div className="dashhead">
            <div>
              <small>DASHBOARD</small>
              <h1>Kelola katalog</h1>
              <p>Tambah gambar produk dan tautan pembelian tanpa mengedit kode.</p>
            </div>
            <b>{products.length} produk</b>
          </div>

          {notice && <div className="notice">{notice}</div>}

          <div className="dashgrid">
            <section className="panel">
              <h2>{editId ? 'Edit produk' : 'Tambah produk'}</h2>
              <form onSubmit={handleSaveProduct}>
                <label>
                  Nama produk *
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Kaos kata-kata unik"
                  />
                </label>

                <div className="two">
                  <label>
                    Kategori
                    <input
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="Kaos Kata-Kata"
                    />
                  </label>
                  <label>
                    Harga (opsional)
                    <input
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="Rp 89.000"
                    />
                  </label>
                </div>

                <label>
                  Link pembelian *
                  <input
                    type="url"
                    value={formBuyUrl}
                    onChange={(e) => setFormBuyUrl(e.target.value)}
                    required
                    placeholder="https://..."
                  />
                </label>

                <label>
                  Upload gambar (JPG/PNG/WEBP, maks. 5 MB)
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>

                <label>
                  Atau URL gambar
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://.../gambar.jpg"
                  />
                </label>

                <label>
                  Deskripsi
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </label>

                <div className="two">
                  <label>
                    Label
                    <input
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      placeholder="Terbaru"
                    />
                  </label>
                  <label>
                    Alt text SEO
                    <input
                      value={formAlt}
                      onChange={(e) => setFormAlt(e.target.value)}
                    />
                  </label>
                </div>

                <button className="btn" type="submit" disabled={isSubmitting}>
                  {editId ? 'Simpan Perubahan' : 'Tambah ke Katalog'} ↗
                </button>
                {editId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{
                      marginLeft: 12,
                      background: 'none',
                      border: 'none',
                      color: '#777',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Batal
                  </button>
                )}
              </form>
            </section>

            <section className="panel">
              <h2>Produk yang sudah ada</h2>
              {products.map((p) => (
                <article className="item" key={p.id}>
                  <img src={p.image} alt={p.alt || p.name} />
                  <div>
                    <strong>{p.name}</strong>
                    <small>
                      {p.category} {p.price ? '• ' + p.price : ''}
                    </small>
                    <a href={p.buy_url} target="_blank" rel="noopener noreferrer">
                      Cek link ↗
                    </a>
                    <div className="actions">
                      <a
                        href="#edit"
                        onClick={(e) => {
                          e.preventDefault();
                          startEdit(p);
                        }}
                      >
                        Edit
                      </a>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleDelete(p.id);
                        }}
                      >
                        <button type="submit">Hapus</button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}

              {products.length === 0 && (
                <p className="empty">
                  Belum ada produk. Tambahkan produk pertama melalui formulir.
                </p>
              )}
            </section>
          </div>
        </main>
      </div>
    );
  }

  // CATALOG FRONTEND VIEW (exact replica of index.php)
  return (
    <div>
      <header>
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigateTo('catalog'); }}>
          <img src="/assets/logo.svg" alt="" />
          <span>kaos-custom<span className="muted">.my.id</span></span>
        </a>
        <nav>
          <a href="#produk">Katalog</a>
          <a href="#tentang">Tentang</a>
          <a className="navbtn" href="#produk">Cari Kaos ↗</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <small>KAOS • KATA-KATA • KARAKTER</small>
          <h1>Kaos yang punya <em>cerita.</em></h1>
          <p>
            Temukan desain unik, humor sehari-hari, kata-kata lokal, dan graphic tee yang sesuai dengan gaya kamu.
          </p>
          <a className="btn" href="#produk">Jelajahi Katalog ↗</a>
          <div className="hint">● Pilih desain favorit, lanjutkan ke toko pembelian.</div>
        </div>
        <div className="art">
          <div className="sticker">
            YOUR<br />STYLE.
          </div>
          <div className="shirt">
            <b>
              MAKE<br />
              <i>YOUR</i><br />
              STATEMENT.
            </b>
          </div>
          <div className="artnote">
            DESAIN PILIHAN<br />
            <strong>UNTUK KAMU</strong>
          </div>
        </div>
      </section>

      <main id="produk">
        <div className="heading">
          <div>
            <small>PILIHAN UNTUKMU</small>
            <h2>Katalog kaos</h2>
            <p>Temukan desain favoritmu dan klik untuk melihat penawaran.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari desain kaos..."
            />
            <button type="submit">⌕</button>
          </form>
        </div>

        {categories.length > 0 && (
          <div className="chips">
            <a
              href="#produk"
              onClick={(e) => {
                e.preventDefault();
                setActiveCategory('');
              }}
              style={activeCategory === '' ? { background: '#151515', color: '#fff' } : {}}
            >
              Semua
            </a>
            {categories.map((c) => (
              <a
                key={c}
                href="#produk"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveCategory(c);
                }}
                style={activeCategory === c ? { background: '#151515', color: '#fff' } : {}}
              >
                {c}
              </a>
            ))}
          </div>
        )}

        <div className="grid">
          {filteredProducts.map((p) => (
            <article className="card" key={p.id}>
              <a className="photo" href={p.buy_url} target="_blank" rel="noopener noreferrer">
                <img src={p.image} alt={p.alt || p.name} loading="lazy" />
                {p.badge && <span>{p.badge}</span>}
              </a>
              <div className="info">
                <small>{p.category || 'Kaos Custom'}</small>
                <h3>{p.name}</h3>
                {p.price && <b>{p.price}</b>}
                {p.description && <p>{p.description}</p>}
                <a className="buy" href={p.buy_url} target="_blank" rel="noopener noreferrer">
                  Lihat & Beli <b>↗</b>
                </a>
              </div>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="empty">
            <h3>{products.length === 0 ? 'Katalog segera hadir' : 'Tidak ada produk yang cocok'}</h3>
            <p>
              {products.length === 0
                ? 'Produk akan ditampilkan di sini setelah ditambahkan melalui admin.'
                : 'Coba gunakan kata kunci pencarian atau kategori lain.'}
            </p>
          </div>
        )}
      </main>

      <section className="about" id="tentang">
        <div>
          <small>TENTANG KAOS CUSTOM</small>
          <h2>
            Gaya boleh sederhana.<br />
            <em>Pesanmu tetap terasa.</em>
          </h2>
        </div>
        <p>
          Temukan pilihan kaos unik untuk berbagai karakter. Kami menampilkan informasi produk dan mengarahkan pengunjung ke tautan pembelian yang tersedia.
        </p>
      </section>

      <footer>
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigateTo('catalog'); }}>
          <img src="/assets/logo.svg" alt="" /> kaos-custom.my.id
        </a>
        <span>© {new Date().getFullYear()} Kaos Custom</span>
        <a
          href="#admin"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('admin', '#admin');
          }}
        >
          Admin
        </a>
      </footer>
    </div>
  );
}
