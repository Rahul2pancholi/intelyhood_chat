function getAccountFeaturesRoot(event) {
  return (
    event.target?.closest?.('[data-account-features]') ||
    event.currentTarget?.closest?.('[data-account-features]')
  );
}

function setActiveChipGroup(root, selector, activeEl) {
  root.querySelectorAll(selector).forEach(el => {
    el.classList.remove('is-active');
  });

  if (activeEl) activeEl.classList.add('is-active');
}

function visibleFeatureCheckboxes(scope) {
  return Array.from(
    scope.querySelectorAll(
      '[data-feature-item]:not(.hidden) input[type="checkbox"]'
    )
  ).filter(checkbox => !checkbox.disabled);
}

function syncFeatureCardState(checkbox) {
  const card = checkbox.closest('[data-feature-item]');
  if (!card) return;
  card.classList.toggle('is-checked', checkbox.checked);
}

function setCheckboxes(checkboxes, checked) {
  checkboxes.forEach(checkbox => {
    checkbox.checked = checked;
    syncFeatureCardState(checkbox);
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function toggleVisibleFeatures(event, checked) {
  const root = getAccountFeaturesRoot(event);
  if (!root) return;

  setCheckboxes(visibleFeatureCheckboxes(root), checked);
}

function toggleSectionFeatures(event, checked) {
  const section =
    event.currentTarget.closest('[data-feature-subgroup]') ||
    event.currentTarget.closest('[data-feature-group]');
  if (!section) return;

  setCheckboxes(visibleFeatureCheckboxes(section), checked);
}

function filterAccountFeatures(event) {
  const root = getAccountFeaturesRoot(event);
  if (!root) return;

  const query = (root.querySelector('[data-feature-search]')?.value || '')
    .trim()
    .toLowerCase();
  const activeCategory =
    root.querySelector('[data-feature-category].is-active')?.dataset
      .featureCategory || 'all';
  const activeChannel =
    root.querySelector('[data-channel-type].is-active')?.dataset.channelType ||
    'all';
  const channelFilters = root.querySelector('[data-channel-filters]');

  if (channelFilters) {
    const showChannelFilters =
      activeCategory === 'all' || activeCategory === 'channels';
    channelFilters.classList.toggle('hidden', !showChannelFilters);
  }

  root.querySelectorAll('[data-feature-group]').forEach(group => {
    let visibleCount = 0;

    group.querySelectorAll('[data-feature-subgroup]').forEach(subgroup => {
      let subgroupVisible = 0;

      subgroup.querySelectorAll('[data-feature-item]').forEach(item => {
        const name = (item.dataset.featureName || '').toLowerCase();
        const category = item.dataset.featureCategory || '';
        const channelType = item.dataset.channelType || '';
        const matchesQuery = !query || name.includes(query);
        const matchesCategory =
          activeCategory === 'all' || category === activeCategory;
        const matchesChannel =
          activeChannel === 'all' ||
          category !== 'channels' ||
          channelType === activeChannel;
        const visible = matchesQuery && matchesCategory && matchesChannel;

        item.classList.toggle('hidden', !visible);
        if (visible) {
          visibleCount += 1;
          subgroupVisible += 1;
        }
      });

      subgroup.classList.toggle('hidden', subgroupVisible === 0);
    });

    group
      .querySelectorAll(':scope > [data-feature-grid] > [data-feature-item]')
      .forEach(item => {
        const name = (item.dataset.featureName || '').toLowerCase();
        const category = item.dataset.featureCategory || '';
        const matchesQuery = !query || name.includes(query);
        const matchesCategory =
          activeCategory === 'all' || category === activeCategory;
        const visible = matchesQuery && matchesCategory;

        item.classList.toggle('hidden', !visible);
        if (visible) visibleCount += 1;
      });

    group.classList.toggle('hidden', visibleCount === 0);
  });

  const emptyState = root.querySelector('[data-feature-empty]');
  if (emptyState) {
    const anyVisible = root.querySelector('[data-feature-item]:not(.hidden)');
    emptyState.classList.toggle('hidden', Boolean(anyVisible));
  }
}

function selectFeatureCategory(event) {
  const button = event.currentTarget;
  const root = button.closest('[data-account-features]');
  if (!root) return;

  setActiveChipGroup(root, '[data-feature-category]', button);

  const allChannelChip = root.querySelector('[data-channel-type="all"]');
  if (allChannelChip)
    setActiveChipGroup(root, '[data-channel-type]', allChannelChip);

  filterAccountFeatures({
    target: root.querySelector('[data-feature-search]') || button,
  });
}

function selectChannelType(event) {
  const button = event.currentTarget;
  const root = button.closest('[data-account-features]');
  if (!root) return;

  const channelsChip = root.querySelector('[data-feature-category="channels"]');
  const allChip = root.querySelector('[data-feature-category="all"]');
  const activeCategory = root.querySelector('[data-feature-category].is-active')
    ?.dataset.featureCategory;
  if (
    activeCategory !== 'all' &&
    activeCategory !== 'channels' &&
    channelsChip
  ) {
    setActiveChipGroup(root, '[data-feature-category]', channelsChip);
  } else if (!activeCategory && allChip) {
    setActiveChipGroup(root, '[data-feature-category]', allChip);
  }

  setActiveChipGroup(root, '[data-channel-type]', button);
  filterAccountFeatures({
    target: root.querySelector('[data-feature-search]') || button,
  });
}

window.filterAccountFeatures = filterAccountFeatures;
window.selectFeatureCategory = selectFeatureCategory;
window.selectChannelType = selectChannelType;
window.toggleVisibleFeatures = toggleVisibleFeatures;
window.toggleSectionFeatures = toggleSectionFeatures;
window.syncFeatureCardState = syncFeatureCardState;
