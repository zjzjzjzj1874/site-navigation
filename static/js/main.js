// 获取所有站点
async function loadSites() {
    try {
        const response = await fetch('/api/sites');
        const sites = await response.json();
        displaySites(sites);
    } catch (error) {
        console.error('加载站点失败:', error);
    }
}

// 显示站点
function displaySites(sites) {
    const modules = document.getElementById('modules');
    modules.innerHTML = '';

    // 按模块分组
    const groupedSites = {};
    sites.forEach(site => {
        if (!groupedSites[site.module]) {
            groupedSites[site.module] = [];
        }
        groupedSites[site.module].push(site);
    });

    // 对每个模块内的站点按照排序值排序
    for (const module in groupedSites) {
        groupedSites[module].sort((a, b) => (b.sort || 0) - (a.sort || 0));
    }

    // 创建模块和站点卡片
    for (const [module, moduleSites] of Object.entries(groupedSites)) {
        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'module';
        
        // 创建模块标题
        const moduleTitleDiv = document.createElement('div');
        moduleTitleDiv.className = 'module-title';
        const moduleType = moduleTypes.find(t => t.key === module);
        moduleTitleDiv.textContent = moduleType ? moduleType.value : module;
        moduleDiv.appendChild(moduleTitleDiv);

        // 创建站点列表容器
        const siteListDiv = document.createElement('div');
        siteListDiv.className = 'site-list';

        // 添加站点卡片
        moduleSites.forEach(site => {
            const siteCard = document.createElement('div');
            siteCard.className = 'site-card';
            siteCard.draggable = true;
            siteCard.dataset.id = site.id;
            siteCard.dataset.sort = site.sort || 0;
            
            // 添加拖拽事件监听
            siteCard.addEventListener('dragstart', handleDragStart);
            siteCard.addEventListener('dragover', handleDragOver);
            siteCard.addEventListener('drop', handleDrop);

            // 创建图标部分
            const iconDiv = document.createElement('div');
            iconDiv.className = 'site-icon ' + (site.icon && !site.icon.startsWith('http') ? 'emoji' : '');
            if (site.icon) {
                if (site.icon.startsWith('http')) {
                    const img = document.createElement('img');
                    img.src = site.icon;
                    img.alt = site.name;
                    iconDiv.appendChild(img);
                } else {
                    iconDiv.textContent = site.icon;
                }
            } else {
                iconDiv.textContent = '🌐';
            }
            siteCard.appendChild(iconDiv);

            // 创建内容部分
            const contentDiv = document.createElement('div');
            contentDiv.className = 'site-content';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'site-name';
            nameDiv.textContent = site.name.trim();
            contentDiv.appendChild(nameDiv);

            const descDiv = document.createElement('div');
            descDiv.className = 'site-desc';
            descDiv.textContent = site.description.trim();
            descDiv.title = site.description.trim();
            contentDiv.appendChild(descDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'site-actions';

            const visitLink = document.createElement('a');
            visitLink.href = site.url;
            visitLink.target = '_blank';
            visitLink.className = 'site-link';
            visitLink.textContent = '访问';
            actionsDiv.appendChild(visitLink);

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.dataset.site = JSON.stringify(site);
            editBtn.textContent = '编辑';
            editBtn.addEventListener('click', function() {
                showEditModal(this.dataset.site);
            });
            actionsDiv.appendChild(editBtn);

            // 添加复制Host按钮
            if (site.host) {
                const copyHostBtn = document.createElement('button');
                copyHostBtn.className = 'copy-host-btn';
                copyHostBtn.textContent = '复制Host';
                copyHostBtn.addEventListener('click', function() {
                    const textarea = document.createElement('textarea');
                    textarea.value = site.host;
                    textarea.style.position = 'fixed';
                    textarea.style.left = '-9999px';
                    document.body.appendChild(textarea);
                    textarea.select();
                    try {
                        document.execCommand('copy');
                        alert('Host配置已复制到剪贴板');
                    } catch (err) {
                        console.error('复制失败:', err);
                    } finally {
                        document.body.removeChild(textarea);
                    }
                });
                actionsDiv.appendChild(copyHostBtn);
            }

            contentDiv.appendChild(actionsDiv);
            siteCard.appendChild(contentDiv);

            // 创建删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', function() {
                deleteSite(site.id);
            });
            siteCard.appendChild(deleteBtn);

            siteListDiv.appendChild(siteCard);
        });

        moduleDiv.appendChild(siteListDiv);
        modules.appendChild(moduleDiv);
    }
}

// 搜索站点
async function searchSites(query) {
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const sites = await response.json();
        displaySites(sites);
    } catch (error) {
        console.error('搜索失败:', error);
    }
}

// 显示添加/编辑模态框
function showAddModal(site = null) {
    const modal = document.getElementById('addModal');
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const siteId = document.getElementById('siteId');

    // 重置表单
    document.getElementById('siteName').value = '';
    document.getElementById('siteUrl').value = '';
    document.getElementById('siteDesc').value = '';
    document.getElementById('siteIcon').value = '';
    document.getElementById('siteHost').value = '';
    document.getElementById('siteSort').value = '0';
    siteId.value = '';

    if (site) {
        modalTitle.textContent = '编辑网站';
        document.getElementById('siteName').value = site.name;
        document.getElementById('siteUrl').value = site.url;
        document.getElementById('siteDesc').value = site.description || '';
        document.getElementById('siteModule').value = site.module;
        document.getElementById('siteIcon').value = site.icon || '';
        document.getElementById('siteHost').value = site.host || '';
        document.getElementById('siteSort').value = site.sort || '0';
        siteId.value = site.id;
    } else {
        modalTitle.textContent = '添加网站';
    }

    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);

    // 添加ESC键关闭功能
    document.addEventListener('keydown', handleEscKey);
    // 添加点击空白区域关闭功能
    modal.addEventListener('click', handleOutsideClick);
}

// 隐藏添加模态框
function hideAddModal() {
    const modal = document.getElementById('addModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);

    // 移除事件监听器
    document.removeEventListener('keydown', handleEscKey);
    modal.removeEventListener('click', handleOutsideClick);
}

// 处理ESC键
function handleEscKey(event) {
    if (event.key === 'Escape') {
        hideAddModal();
    }
}

// 处理点击空白区域
function handleOutsideClick(event) {
    if (event.target.classList.contains('modal')) {
        hideAddModal();
    }
}

// 显示编辑模态框
function showEditModal(siteJson) {
    const site = JSON.parse(siteJson);
    showAddModal(site);
}

// 提交站点（添加/编辑）
async function submitSite() {
    const siteId = document.getElementById('siteId').value;
    const name = document.getElementById('siteName').value;
    const url = document.getElementById('siteUrl').value;
    const description = document.getElementById('siteDesc').value;
    const module = document.getElementById('siteModule').value;
    const icon = document.getElementById('siteIcon').value;
    const host = document.getElementById('siteHost').value;
    const sort = parseInt(document.getElementById('siteSort').value) || 0;

    if (!name || !url || !module) {
        alert('请填写必要信息');
        return;
    }

    try {
        const apiUrl = siteId ? `/api/sites/${siteId}` : '/api/sites';
        const method = siteId ? 'PUT' : 'POST';
        
        const response = await fetch(apiUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                url,
                description,
                module,
                icon,
                host,
                sort
            })
        });

        if (response.ok) {
            hideAddModal();
            loadSites();
            // 清空表单
            document.getElementById('siteName').value = '';
            document.getElementById('siteUrl').value = '';
            document.getElementById('siteDesc').value = '';
            document.getElementById('siteIcon').value = '';
            document.getElementById('siteHost').value = '';
            document.getElementById('siteSort').value = '0';
        } else {
            alert('添加失败');
        }
    } catch (error) {
        console.error('添加站点失败:', error);
        alert('添加失败');
    }
}

// 删除站点
async function deleteSite(id) {
    if (!confirm('确定要删除这个站点吗？')) {
        return;
    }

    try {
        const response = await fetch(`/api/sites/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadSites();
        } else {
            alert('删除失败');
        }
    } catch (error) {
        console.error('删除站点失败:', error);
        alert('删除失败');
    }
}

// 拖拽相关函数
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

function handleDragOver(e) {
    e.preventDefault();
}

async function handleDrop(e) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const dropTarget = e.target.closest('.site-card');
    
    if (!dropTarget || draggedId === dropTarget.dataset.id) return;
    
    const siteList = dropTarget.parentElement;
    const cards = Array.from(siteList.children);
    const dropIndex = cards.indexOf(dropTarget);
    
    // 获取前后站点的sort值
    const prevSort = dropIndex > 0 ? parseInt(cards[dropIndex - 1].dataset.sort) : null;
    const nextSort = dropIndex < cards.length - 1 ? parseInt(cards[dropIndex + 1].dataset.sort) : null;
    
    // 计算新的sort值
    let newSort;
    if (prevSort !== null && nextSort !== null) {
        newSort = Math.floor((prevSort + nextSort) / 2);
    } else {
        // 如果没有前或后站点，保持原有sort值
        const draggedCard = document.querySelector(`.site-card[data-id="${draggedId}"]`);
        newSort = parseInt(draggedCard.dataset.sort);
    }
    
    // 更新站点排序
    try {
        const response = await fetch(`/api/sites/${draggedId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sort: newSort
            })
        });
        
        if (response.ok) {
            loadSites(); // 重新加载站点列表
        } else {
            alert('更新排序失败');
        }
    } catch (error) {
        console.error('更新排序失败:', error);
        alert('更新排序失败');
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 加载模块类型
    try {
        const response = await fetch('/api/modules/types');
        const types = await response.json();
        moduleTypes = types;
        const moduleSelect = document.getElementById('siteModule');
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.key;
            option.textContent = type.value;
            moduleSelect.appendChild(option);
        });
        // 加载站点列表
        await loadSites();
    } catch (error) {
        console.error('加载模块类型失败:', error);
    }

    // 为所有站点描述添加悬停事件
    document.addEventListener('mouseover', function(e) {
        if (e.target.classList.contains('site-desc')) {
            const desc = e.target.getAttribute('title');
            if (desc) {
                showTooltip(e.target, desc);
            }
        }
    });

    document.addEventListener('mouseout', function(e) {
        if (e.target.classList.contains('site-desc')) {
            hideTooltip();
        }
    });
});

function showTooltip(element, text) {
    // 移除旧的tooltip
    hideTooltip();

    // 创建tooltip元素
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);

    // 计算位置
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    tooltip.style.left = rect.left + (rect.width / 2) - (tooltipRect.width / 2) + 'px';
    tooltip.style.top = rect.bottom + window.scrollY + 'px';

    // 显示tooltip
    requestAnimationFrame(() => tooltip.classList.add('show'));
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}