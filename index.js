const PRODUCT_ENDPOINT = 'https://6aff15db3a0e70bc8d54929b.mockapi.io/nestle/products/1';
const REQUEST_TIMEOUT_MS = 4000;

const renderSummary = ({ name, description, price, originalPrice, currency, rating, isNew }) => {
  const formatPrice = amount => amount.toLocaleString('en-US', { style: 'currency', currency });
  const discountAmount = originalPrice - price;
  const isOnSale = discountAmount > 0;
  const ratingFill = rating * 20;
  document.title = `${name} Running Shoes`;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('.product__content .product__title').textContent = name;
  document.querySelector('.product-info__description').textContent = description;
  document.querySelector('.badge_new').hidden = !isNew;
  document.querySelector('.product__badges .badge_sale').hidden = !isOnSale;
  document.querySelector('.product__current-price').textContent = formatPrice(price);
  document.querySelector('.product__rating-value').textContent = rating.toFixed(1);
  document.querySelector('.product__stars').style.backgroundImage =
    `linear-gradient(90deg, #e6a600 ${ratingFill}%, #efe2bc ${ratingFill}%)`;

  if (isOnSale) {
    const discountBadge = document.querySelector('.gallery__discount');
    const originalPriceLabel = document.querySelector('.product__original-price');
    const discountAmountLabel = document.querySelector('.product__discount-amount');
    discountBadge.textContent = `−${Math.round((discountAmount / originalPrice) * 100)}%`;
    originalPriceLabel.textContent = formatPrice(originalPrice);
    discountAmountLabel.textContent = `Save ${formatPrice(discountAmount)}`;
    discountBadge.hidden = false;
    originalPriceLabel.hidden = false;
    discountAmountLabel.hidden = false;
  }
};

const renderGallery = (images, name) => {
  const imageFrame = document.querySelector('.gallery__photo');
  const mainImage = imageFrame.querySelector('img') ?? new Image(800, 800);
  const unavailable = document.querySelector('.gallery__unavailable');
  const imagePreviews = document.querySelector('.gallery__previews');
  const hasImages = images.length > 0;
  imagePreviews.replaceChildren();
  imagePreviews.hidden = !hasImages;
  mainImage.hidden = !hasImages;
  unavailable.hidden = hasImages;

  const showImage = (src, alt, button) => {
    imagePreviews.querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed', 'true');
    mainImage.alt = alt;
    mainImage.src = src;
    mainImage.hidden = false;
    unavailable.hidden = true;
  };

  images.forEach(({ src, alt }, index) => {
    const imageAlt = `${alt} of ${name}`;
    const button = document.createElement('button');
    const fallback = document.createElement('span');
    const previewImage = new Image(72, 72);
    button.className = 'gallery__preview';
    button.type = 'button';
    button.setAttribute('aria-label', `Show ${alt.toLowerCase()}`);
    button.setAttribute('aria-pressed', 'false');
    fallback.textContent = alt;
    fallback.hidden = true;
    previewImage.alt = imageAlt;
    previewImage.onerror = () => {
      previewImage.hidden = true;
      fallback.hidden = false;
    };
    previewImage.src = src;
    button.append(previewImage, fallback);
    button.addEventListener('click', () => showImage(src, imageAlt, button));
    imagePreviews.append(button);

    if (index === 0) {
      showImage(src, imageAlt, button);
    }
  });

  if (hasImages && !mainImage.isConnected) {
    mainImage.onerror = () => {
      mainImage.hidden = true;
      unavailable.hidden = false;
    };
    imageFrame.prepend(mainImage);
  }
};

const createChoice = (group, value, selected, disabled = false) => {
  const label = document.createElement('label');
  const radio = document.createElement('input');
  const face = document.createElement('span');

  label.className = `choice choice_${group}`;
  radio.type = 'radio';
  radio.name = group;
  radio.value = value;
  radio.checked = selected;
  radio.disabled = disabled;
  label.append(radio, face);
  return { label, radio, face };
};

const renderChoices = ({ colors, sizes, name }) => {
  const colorOptions = document.querySelector('.product__choices_colors');
  const selectedColor = document.querySelector('.product__color-name');
  const sizeOptions = document.querySelector('.product__content .product__choices_sizes');
  const initialSize = sizes.find(size => size.available);

  const selectColor = ({ name: colorName, images }) => {
    selectedColor.textContent = colorName;
    renderGallery(images, name);
  };

  colors.forEach((color, index) => {
    const { name: colorName, hex } = color;
    const { label, radio, face } = createChoice('color', colorName, index === 0);
    radio.setAttribute('aria-label', colorName);
    radio.addEventListener('change', () => selectColor(color));
    face.style.backgroundColor = hex;
    colorOptions.append(label);
  });
  selectColor(colors[0]);

  sizes.forEach(size => {
    const { value, available } = size;
    const { label, face } = createChoice('size', value, size === initialSize, !available);
    face.textContent = value;
    sizeOptions.append(label);
  });
};

const setupQuantity = stock => {
  const quantity = document.querySelector('.quantity__value');
  const decrease = document.querySelector('.quantity__button_decrease');
  const increase = document.querySelector('.quantity__button_increase');
  const stockLabel = document.querySelector('.product__stock');
  const minimum = stock > 0 ? 1 : 0;
  let count = minimum;

  stockLabel.textContent = stock > 0 ? `✅ Only ${stock} left in stock` : '❌ Out of stock';
  stockLabel.classList.toggle('product__stock_empty', stock === 0);

  const updateQuantity = change => {
    count = Math.min(stock, Math.max(minimum, count + change));
    quantity.value = count;
    decrease.disabled = count === minimum;
    increase.disabled = count === stock;
  };

  decrease.addEventListener('click', () => updateQuantity(-1));
  increase.addEventListener('click', () => updateQuantity(1));
  updateQuantity(0);
};

const setupSizeGuide = ({ name, sizeGuide }) => {
  const trigger = document.querySelector('.product__content .product__size-guide');
  const dialog = document.querySelector('.size-guide');
  const rows = dialog.querySelector('.size-guide__rows');
  dialog.querySelector('.size-guide__caption').textContent = `Shoe size conversions for ${name}`;

  sizeGuide.forEach(({ eu, uk, us, footLength }) => {
    const row = rows.insertRow();
    const header = document.createElement('th');
    header.scope = 'row';
    header.textContent = eu;
    row.append(header);
    [uk, us, footLength.toFixed(1)].forEach(value => {
      row.insertCell().textContent = value;
    });
  });

  trigger.addEventListener('click', () => {
    trigger.focus({ preventScroll: true });
    dialog.showModal();
  });

  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const { left, top, right, bottom } = dialog.getBoundingClientRect();
    if (
      event.clientX < left ||
      event.clientX > right ||
      event.clientY < top ||
      event.clientY > bottom
    ) {
      dialog.close();
    }
  });
};

const setupTabs = ({ rating, reviewsCount }) => {
  const tablist = document.querySelector('.product-info__tabs');
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const reviewsTab = document.getElementById('reviews-tab');
  const reviewsButton = document.querySelector('.product__reviews-button');
  const reviewCount = `${reviewsCount} ${reviewsCount === 1 ? 'review' : 'reviews'}`;

  reviewsTab.textContent = `Reviews (${reviewsCount})`;
  reviewsButton.textContent = reviewCount;
  document.querySelector('.product-info__reviews-summary').textContent =
    `Rated ${rating.toFixed(1)} out of 5 from ${reviewCount}`;

  const selectTab = selectedTab => {
    tabs.forEach(tab => {
      const selected = tab === selectedTab;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
    });
    selectedTab.focus();
  };

  tabs.forEach(tab => {
    tab.dataset.label = tab.textContent.trim();
    tab.addEventListener('click', () => selectTab(tab));
  });

  tablist.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    let nextIndex;

    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'ArrowRight':
        nextIndex = (index + 1) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectTab(tabs[nextIndex]);
  });

  reviewsButton.addEventListener('click', () => selectTab(reviewsTab));
};

const initialize = async () => {
  const skeleton = document.querySelector('.skeleton');
  skeleton.hidden = false;
  document.querySelector('.gallery__previews').hidden = false;
  try {
    const response = await fetch(PRODUCT_ENDPOINT, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`⚠️ Product request failed (${response.status})`);

    const product = await response.json();
    renderSummary(product);
    renderChoices(product);
    setupQuantity(product.stock);
    setupSizeGuide(product);
    setupTabs(product);

    document.querySelector('.product__content').hidden = false;
    document.querySelector('.product-info').hidden = false;
  } catch {
    document.querySelector('.product__layout').hidden = true;
    document.querySelector('.product__error').hidden = false;
  } finally {
    skeleton.hidden = true;
  }
};

initialize();
