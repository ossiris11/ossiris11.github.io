(function () {
    'use strict';

    console.log('[OSTAP-TV]', 'Golden Cinema core initialization loaded.');

    function injectStyles() {
        if (!document.getElementById('ostap-tv-inline-css')) {
            var style = document.createElement('style');
            style.id = 'ostap-tv-inline-css';
            style.textContent = `
                .head__title {
                    font-weight: 700 !important;
                    letter-spacing: 0.05em;
                }
                .head__logo-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .ostap-gold-badge {
                    display: inline-block;
                    font-size: 0.6em;
                    font-weight: 800;
                    background: linear-gradient(135deg, #F3D079, #D8B46A, #9E7D3B);
                    color: #090A0D;
                    padding: 0.2em 0.55em;
                    border-radius: 0.35em;
                    margin-left: 0.6em;
                    text-transform: uppercase;
                    vertical-align: middle;
                    letter-spacing: 0.08em;
                    box-shadow: 0 0 10px rgba(216, 180, 106, 0.4);
                }
                .lp-step {
                    color: #F5F5F3 !important;
                    font-weight: 600 !important;
                    font-size: 1.4em !important;
                    letter-spacing: 0.04em !important;
                }
                .lp-status {
                    color: #D8B46A !important;
                    font-weight: 500 !important;
                    opacity: 0.85 !important;
                    margin-top: 0.4em !important;
                }
                .head__action.open--broadcast,
                .head__action.notice--icon,
                .head__action.open--profile,
                .open--broadcast,
                .notice--icon,
                [data-section="diagnostics"],
                .shikimori-local__section[data-section="diagnostics"],
                .diagnostics-page {
                    display: none !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                    width: 0 !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .full-start__button.view--torrent {
                    display: inline-flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    function arrangeCardButtons(root) {
        var card = (root && root.length) ? root : $('body');
        var buttonsRow = card.find('.full-start-new__buttons');
        if (!buttonsRow.length) return;

        var playBtn = buttonsRow.find('.button--play');
        var torrentBtn = card.find('.view--torrent');
        var trailerBtn = card.find('.view--trailer');

        if (!torrentBtn.length && playBtn.length) {
            torrentBtn = $('<div class="full-start__button selector view--torrent"><svg><use xlink:href="#sprite-torrent"></use></svg><span>Торренты</span></div>');
            playBtn.after(torrentBtn);
            torrentBtn.on('hover:enter', function () {
                var movie = (window.Lampa && Lampa.Activity.active() && Lampa.Activity.active().movie) || card.data('card') || {};
                var year = ((movie.first_air_date || movie.release_date || '0000') + '').slice(0, 4);
                var title = (movie.title || movie.name || '').trim();
                var orig_title = (movie.original_title || movie.original_name || '').replace(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf]/g, '').trim();
                var search = title || orig_title;

                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('title_torrents'),
                    component: 'torrents',
                    search: search,
                    search_one: title,
                    search_two: orig_title,
                    movie: movie,
                    page: 1
                });
            });
        } else if (torrentBtn.length && playBtn.length) {
            if (!torrentBtn.parent().is(buttonsRow)) {
                playBtn.after(torrentBtn);
            }
            torrentBtn.removeClass('hide').show();
        }

        if (trailerBtn.length && playBtn.length) {
            var afterTarget = torrentBtn.length ? torrentBtn : playBtn;
            if (!trailerBtn.parent().is(buttonsRow) || trailerBtn.prev()[0] !== afterTarget[0]) {
                afterTarget.after(trailerBtn);
            }
            trailerBtn.removeClass('hide').show();
        }
    }

    function cleanSources(root) {
        // Arrange Torrent and Trailer buttons next to Play button on the card
        arrangeCardButtons(root);

        // Hide Search source tabs (TMDB, CUB) completely
        $('.search__sources, .search-source, [data-area="sources"]').remove();

        // In Selectbox (Источник dialog)
        $('.selectbox-item').each(function () {
            var item = $(this);
            var subtitle = item.find('.selectbox-item__subtitle');

            if (subtitle.text().indexOf('online_mod') > -1) {
                subtitle.remove();
            }
        });

        // Ensure any Lampa mentions in UI buttons or text are rebranded
        var container = (root && root.length) ? root : $('body');
        container.find('[data-action="lampa-search"]').each(function () {
            var btn = $(this);
            if (btn.text().indexOf('Lampa') > -1) {
                btn.text('Найти в OSTAP TV');
            }
        });
        container.find('.shikimori-local__action, .button, .selectbox-item__title, .settings-param__name, .menu__text').each(function () {
            var el = $(this);
            var txt = el.text();
            if (txt.indexOf('Lampa') > -1 || txt.indexOf('ShikiLamp') > -1) {
                el.text(txt.replace(/ShikiLamp/g, 'Shikimori').replace(/Найти в Lampa/g, 'Найти в OSTAP TV').replace(/Lampa/g, 'OSTAP TV'));
            }
        });
    }

    function removePromos() {
        cleanSources();

        // Remove Shikimori Diagnostics item
        $('[data-section="diagnostics"], .shikimori-local__section[data-section="diagnostics"], .diagnostics-page').remove();

        // Remove feed head promotional banner (lampa_movie promo)
        $('.feed-head').remove();

        // Remove unused action icons (broadcast, notification bell, profile, pumpkin)
        $('.head__action.open--broadcast, .head__action.notice--icon, .open--broadcast, .notice--icon').remove();
        $('.head__action, .head__markers > div').each(function () {
            var el = $(this);
            var html = el.html();
            if (html.indexOf('halloween') > -1 || html.indexOf('pumpkin') > -1 || el.hasClass('open--profile') || el.hasClass('open--broadcast') || el.hasClass('notice--icon')) {
                el.remove();
            }
        });

        // Close and remove any open modal with CUB promo / Halloween sale
        $('.modal').each(function () {
            var modal = $(this);
            var text = modal.text();
            if (text.indexOf('CUB') > -1 || text.indexOf('cub.best') > -1 || text.indexOf('скидк') > -1 || text.indexOf('Хэллоуин') > -1) {
                modal.remove();
                if (window.Lampa && Lampa.Modal) {
                    try { Lampa.Modal.close(); } catch (e) {}
                }
            }
        });
    }

    function fixMenuStorage() {
        if (!window.Lampa || !Lampa.Storage) return;

        var cleanSort = [
            'Главная',
            'Лента',
            'Фильмы',
            'Сериалы',
            'Мультфильмы',
            'Аниме',
            'ТВ Каналы',
            'Закладки',
            'История'
        ];

        // Wrap Storage.set once to prevent saving duplicate menu items
        if (!Lampa.Storage._ostap_dedup_wrapped) {
            Lampa.Storage._ostap_dedup_wrapped = true;
            var origSet = Lampa.Storage.set;
            Lampa.Storage.set = function (key, value) {
                if (key === 'menu_sort' && Array.isArray(value)) {
                    var seen = {};
                    value = value.filter(function (item) {
                        if (seen[item]) return false;
                        seen[item] = true;
                        return true;
                    });
                }
                return origSet.call(this, key, value);
            };
        }

        // Clean up stored menu_sort if corrupted with duplicate IPTV entries
        var curSort = Lampa.Storage.get('menu_sort', []);
        var needsReset = false;
        if (Array.isArray(curSort)) {
            var iptvCount = curSort.filter(function (x) { return x === 'ТВ Каналы'; }).length;
            if (iptvCount > 1 || curSort.length > 12) {
                needsReset = true;
            }
        } else {
            needsReset = true;
        }

        if (needsReset) {
            Lampa.Storage.set('menu_sort', cleanSort);
        }

        // Clean up menu_hide: ensure primary items are never hidden
        var curHide = Lampa.Storage.get('menu_hide', []);
        if (Array.isArray(curHide) && curHide.length) {
            var filteredHide = curHide.filter(function (x) {
                return cleanSort.indexOf(x) === -1;
            });
            if (filteredHide.length !== curHide.length) {
                Lampa.Storage.set('menu_hide', filteredHide);
            }
        }
    }

    function reorderMenu() {
        fixMenuStorage();

        // 1. Remove any duplicate IPTV items across the entire menu
        $('.menu__case.nosort [data-action="iptv_channels"]').remove();
        var allIptv = $('.menu [data-action="iptv_channels"]');
        if (allIptv.length > 1) {
            allIptv.slice(1).remove();
        }

        var firstCase = $('.menu .menu__case:first-child');
        var menuList = firstCase.find('.menu__list');
        if (!menuList.length) menuList = $('.menu .menu__list').first();
        if (!menuList.length) return;

        // 2. Remove unwanted default items (torrents, extra catalog, timetable, etc.)
        menuList.find('[data-action="mytorrents"], [data-action="timetable"], [data-action="subscribes"], [data-action="myperson"], [data-action="filter"], [data-action="catalog"], [data-action="relise"]').remove();

        // Remove duplicate built-in anime if shikimori exists
        if (menuList.find('.shikimori-local-menu-item').length) {
            menuList.find('[data-action="anime"]').remove();
        }

        // If IPTV item exists in document but outside menuList, move it inside
        var iptvItem = $('[data-action="iptv_channels"]').first();
        if (iptvItem.length && !iptvItem.parent().is(menuList)) {
            menuList.append(iptvItem);
        }

        // If Shikimori item exists in document but outside menuList, move it inside
        var shikiItem = $('.shikimori-local-menu-item').first();
        if (shikiItem.length && !shikiItem.parent().is(menuList)) {
            menuList.append(shikiItem);
        }

        // 3. Desired exact order:
        // 1. Главная
        // 2. Лента
        // 3. Фильмы
        // 4. Сериалы
        // 5. Мультфильмы
        // 6. Аниме (Shikimori)
        // 7. ТВ Каналы
        // 8. Закладки
        // 9. История
        var targetOrder = [
            '[data-action="main"]',
            '[data-action="feed"]',
            '[data-action="movie"]',
            '[data-action="tv"]',
            '[data-action="cartoon"]',
            '.shikimori-local-menu-item',
            '[data-action="iptv_channels"]',
            '[data-action="favorite"]',
            '[data-action="history"]'
        ];

        targetOrder.forEach(function (selector) {
            var el = menuList.find(selector);
            if (el.length) {
                el.removeClass('hidden hide');
                menuList.append(el);
            }
        });

        // Rename Shikimori item to Аниме
        $('.shikimori-local-menu-item .menu__text').text('Аниме');
    }

    function setupSearch() {
        if (window.Lampa) {
            if (Lampa.Storage) {
                Lampa.Storage.set('source', 'tmdb');
            }

            if (Lampa.Api) {
                // Ensure CUB discovery delegates to TMDB or is neutralized
                if (Lampa.Api.sources && Lampa.Api.sources.cub) {
                    Lampa.Api.sources.cub.discovery = function () {
                        return (Lampa.Api.sources.tmdb && Lampa.Api.sources.tmdb.discovery) ? Lampa.Api.sources.tmdb.discovery() : null;
                    };
                }
                // Force availableDiscovery to return only 1 source: TMDB
                Lampa.Api.availableDiscovery = function () {
                    if (Lampa.Api.sources && Lampa.Api.sources.tmdb && Lampa.Api.sources.tmdb.discovery) {
                        return [Lampa.Api.sources.tmdb.discovery()];
                    }
                    return [];
                };
            }

            if (Lampa.Search && Lampa.Search.listener) {
                Lampa.Search.listener.follow('open', function () {
                    $('.search__sources, .search-source, [data-area="sources"]').remove();
                });
            }
        }
    }

    function sanitizeTitle(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/Главная\s*-\s*TMDB/gi, 'Главная - Ostap TV')
                  .replace(/Главная\s*-\s*tmdb/gi, 'Главная - Ostap TV')
                  .replace(/\s*-\s*TMDB/gi, ' - Ostap TV')
                  .replace(/\s*-\s*Lampa/gi, ' - Ostap TV')
                  .replace(/ShikiLamp/gi, 'Shikimori')
                  .replace(/\bLampa\b/g, 'OSTAP TV');
    }

    function setupHeaderTitle() {
        if (window.Lampa && Lampa.Head && Lampa.Head.title) {
            if (!Lampa.Head._ostap_title_wrapped) {
                Lampa.Head._ostap_title_wrapped = true;
                var origHeadTitle = Lampa.Head.title;
                Lampa.Head.title = function (title) {
                    return origHeadTitle.call(this, sanitizeTitle(title));
                };
            }
        }

        var headEl = $('.head__title');
        if (headEl.length) {
            var curr = headEl.text();
            if (curr && (curr.indexOf('TMDB') > -1 || curr.indexOf('tmdb') > -1)) {
                headEl.text(sanitizeTitle(curr));
            }
        }

        if (window.location && window.location.search && window.history && window.history.replaceState) {
            var search = window.location.search;
            if (search.indexOf('TMDB') > -1 || search.indexOf('tmdb') > -1) {
                var newSearch = search.replace(/([?&]title=)([^&]*)/gi, function (match, p1, p2) {
                    var decoded = decodeURIComponent(p2);
                    return p1 + encodeURIComponent(sanitizeTitle(decoded));
                });
                if (newSearch !== search) {
                    window.history.replaceState({}, '', window.location.pathname + newSearch + window.location.hash);
                }
            }
        }
    }

    function initBranding() {
        // Change header logo to the golden 3D emblem
        var logoIcon = document.querySelector('.head__logo-icon img');
        if (logoIcon) {
            logoIcon.src = './img/logo-icon.png';
            logoIcon.alt = 'OSTAP-TV';
        }

        // Set document title
        document.title = 'OSTAP TV - Golden Cinema';

        // Wrap notifications to sanitize any remaining mentions from third-party plugins
        if (window.Lampa && Lampa.Noty && Lampa.Noty.show && !Lampa.Noty._ostap_filter_wrapped) {
            Lampa.Noty._ostap_filter_wrapped = true;
            var origNotyShow = Lampa.Noty.show;
            Lampa.Noty.show = function (text) {
                if (typeof text === 'string') {
                    text = text.replace(/ShikiLamp/gi, 'Shikimori')
                               .replace(/Найти в Lampa/gi, 'Найти в OSTAP TV')
                               .replace(/Lampa/gi, 'OSTAP TV');
                }
                return origNotyShow.call(this, text);
            };
        }

        // Setup single-source search and hide tabs
        setupSearch();

        // Setup header title branding (Главная - Ostap TV)
        setupHeaderTitle();

        // Configure default high-quality streaming settings (1080p / 4K)
        if (window.Lampa && Lampa.Storage) {
            if (!Lampa.Storage.get('video_quality_default')) {
                Lampa.Storage.set('video_quality_default', '1080');
            }
            var currBal = Lampa.Storage.get('online_mod_balanser', '');
            if (!currBal || currBal === 'alloha' || currBal === 'cdnvideohub') {
                Lampa.Storage.set('online_mod_balanser', 'collaps');
            }
            Lampa.Storage.set('player_quality', true);
            Lampa.Storage.set('online_mod_collaps_lampa_player', true);

            // Configure TorrServer & Torrents (Dedicated Cloud VPS + Jackett Aggregator)
            Lampa.Storage.set('torrents_use', true);
            Lampa.Storage.set('torrserver_url', 'http://2.26.103.102:8090');
            Lampa.Storage.set('torrserver_url_two', 'http://2.26.103.102/torrserver');
            Lampa.Storage.set('torrserver_use_link', 'one');
            Lampa.Storage.set('torrserver_preload', true);
            Lampa.Storage.set('parser_use', true);
            Lampa.Storage.set('parser_torrent_type', 'jackett');
            Lampa.Storage.set('jackett_url', 'http://2.26.103.102/jackett');
            Lampa.Storage.set('jackett_url_two', 'http://2.26.103.102:8088/jackett');
            Lampa.Storage.set('jackett_key', '4m12a0z79pebk534e3hepazpdjyc6gm3');
            Lampa.Storage.set('jackett_key_two', '4m12a0z79pebk534e3hepazpdjyc6gm3');
            Lampa.Storage.set('parser_use_link', 'one');
            Lampa.Storage.set('torrents_sort', 'Seeders');
            Lampa.Storage.set('parse_lang', 'lg');
            Lampa.Storage.set('parse_timeout', '10');
        }

        // Remove CUB profile icon from header
        var cubProfile = document.querySelector('.open--profile');
        if (cubProfile) cubProfile.remove();

        // Listen for settings opening and remove CUB account section
        if (window.Lampa && Lampa.Settings && Lampa.Settings.listener) {
            Lampa.Settings.listener.follow('open', function (e) {
                if (e.name === 'main' && e.body) {
                    $('.settings-folder[data-component="account"]', e.body).remove();
                }
            });
        }

        // Initial promo and sources cleanup
        removePromos();

        // Efficient DOM observer instead of heavy polling intervals (zero idle CPU usage)
        if (window.MutationObserver) {
            var promoDebounce = null;
            var promoObserver = new MutationObserver(function () {
                if (promoDebounce) return;
                promoDebounce = setTimeout(function () {
                    promoDebounce = null;
                    removePromos();
                    setupHeaderTitle();
                }, 120);
            });
            promoObserver.observe(document.body, { childList: true, subtree: true });
        } else {
            setInterval(function () {
                removePromos();
                setupHeaderTitle();
            }, 1000);
        }

        // Reorder menu items cleanly
        reorderMenu();
        var menuInterval = setInterval(reorderMenu, 300);
        setTimeout(function () {
            clearInterval(menuInterval);
        }, 3000);

        if (window.Lampa && Lampa.Listener) {
            Lampa.Listener.follow('activity', function (e) {
                if (e.object && e.object.title) {
                    e.object.title = sanitizeTitle(e.object.title);
                }
                setupHeaderTitle();
                if (e.type === 'start') {
                    reorderMenu();
                    cleanSources();
                }
            });
            Lampa.Listener.follow('full', function (e) {
                var body = (e && e.body) ? e.body : $('body');
                cleanSources(body);
                setTimeout(function () { cleanSources(body); }, 150);
                setTimeout(function () { cleanSources(body); }, 400);
            });

            // Защита от наложения звука (ghosting / zombie video): гарантированная остановка всех видео при закрытии плеера
            if (Lampa.Player && Lampa.Player.listener) {
                Lampa.Player.listener.follow('destroy', function () {
                    $('video').each(function () {
                        if ($(this).hasClass('screensaver__video')) return;
                        try { this.pause(); } catch (e) {}
                        try { this.muted = true; } catch (e) {}
                        try {
                            this.removeAttribute('src');
                            if (this.srcObject) this.srcObject = null;
                            this.load();
                        } catch (e) {}
                        if (!$(this).parent().is('body')) $(this).remove();
                    });
                });
            }
        }
    }

    function loadBuiltinPlugins() {
        if (!window.Lampa || !Lampa.Utils) return;

        var v = '?v=' + Date.now();

        // 1. Load Kinopoisk / IMDB rating plugin
        Lampa.Utils.putScript(['./plugins/rating.js' + v], function () {
            console.log('[OSTAP-TV]', 'Golden Rating plugin loaded.');
        });

        // 2. Load Online sources plugin (Kodik, Rezka, Alloha, Collaps, Filmix)
        Lampa.Utils.putScript(['./plugins/online.js' + v], function () {
            console.log('[OSTAP-TV]', 'Online video balancers (Kodik / Rezka) loaded.');
        });

        // 3. Load Shikimori dedicated Anime catalog
        Lampa.Utils.putScript(['./plugins/shikimori.js' + v], function () {
            console.log('[OSTAP-TV]', 'Shikimori anime catalog plugin loaded.');
            setTimeout(reorderMenu, 200);
        });

        // 4. Load IPTV live TV channels
        Lampa.Utils.putScript(['./plugins/iptv.js' + v], function () {
            console.log('[OSTAP-TV]', 'Live TV Channels plugin loaded.');
            setTimeout(reorderMenu, 300);
        });
    }

    function start() {
        injectStyles();

        if (window.appready) {
            initBranding();
            loadBuiltinPlugins();
        } else if (window.Lampa && Lampa.Listener) {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') {
                    initBranding();
                    loadBuiltinPlugins();
                }
            });
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                initBranding();
                loadBuiltinPlugins();
            });
        }
    }

    start();
})();
