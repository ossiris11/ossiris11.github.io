(function () {
    'use strict';

    var PLUGIN_NAME = 'iptv_country_parser';

    var COUNTRIES = [
        { title: '🇷🇺 Россия', code: 'ru' },
        { title: '🇰🇿 Казахстан', code: 'kz' },
        { title: '🇺🇸 США', code: 'us' },
        { title: '🇬🇧 Великобритания', code: 'uk' }
    ];

    // Яркие стили интерфейса с высоким контрастом (Golden Cinema)
    function injectStyles() {
        if ($('#iptv-bright-styles').length) return;
        var style = $(
            '<style id="iptv-bright-styles">' +
                '.iptv-scroll-view { -webkit-mask-image: none !important; mask-image: none !important; opacity: 1 !important; width: 100% !important; height: calc(100vh - 4.5em) !important; max-height: calc(100vh - 4.5em) !important; box-sizing: border-box !important; overflow: hidden !important; }' +
                '.iptv-scroll-view .scroll__content { width: 100% !important; box-sizing: border-box !important; }' +
                '.iptv-scroll-view .scroll__body { width: 100% !important; box-sizing: border-box !important; }' +
                '.iptv-container { padding: 20px 35px 120px 35px !important; width: 100% !important; box-sizing: border-box !important; opacity: 1 !important; }' +
                
                '/* Кнопки выбора стран */' +
                '.iptv-btn-country { background: rgba(23, 26, 32, 0.95) !important; color: #FFFFFF !important; border: 1.5px solid rgba(216, 180, 106, 0.3) !important; border-radius: 12px !important; font-weight: 600 !important; padding: 10px 20px !important; margin: 5px !important; font-size: 15px !important; cursor: pointer !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5) !important; transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1) !important; opacity: 1 !important; }' +
                '.iptv-btn-country.active-country { border: 2px solid #D8B46A !important; color: #F3D079 !important; background: rgba(216, 180, 106, 0.25) !important; box-shadow: 0 0 16px rgba(216, 180, 106, 0.4) !important; font-weight: 700 !important; }' +
                '.iptv-btn-country.focus { background: linear-gradient(135deg, #F3D079, #D8B46A, #9E7D3B) !important; color: #090A0D !important; border-color: #FFFFFF !important; transform: scale(1.08) !important; font-weight: 800 !important; box-shadow: 0 0 25px rgba(216, 180, 106, 0.6), 0 8px 20px rgba(0, 0, 0, 0.8) !important; }' +
                
                '/* Карточки ТВ-каналов */' +
                '.iptv-channel-card { display: flex !important; align-items: center !important; width: 100% !important; max-width: 960px !important; padding: 14px 22px !important; margin-bottom: 10px !important; background: rgba(23, 26, 32, 0.95) !important; border: 1.5px solid rgba(216, 180, 106, 0.3) !important; border-radius: 14px !important; box-sizing: border-box !important; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; transition: all 0.22s cubic-bezier(0.25, 1, 0.5, 1) !important; opacity: 1 !important; cursor: pointer !important; }' +
                '.iptv-channel-card .logo-box { width: 52px !important; height: 52px !important; min-width: 52px !important; display: flex !important; align-items: center !important; justify-content: center !important; background: rgba(9, 10, 13, 0.8) !important; border: 1px solid rgba(216, 180, 106, 0.25) !important; border-radius: 10px !important; margin-right: 18px !important; overflow: hidden !important; }' +
                '.iptv-channel-card .ch-title { color: #FFFFFF !important; font-size: 19px !important; font-weight: 700 !important; letter-spacing: 0.02em !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8) !important; }' +
                '.iptv-channel-card .ch-group { color: #D8B46A !important; font-size: 13px !important; font-weight: 600 !important; margin-top: 4px !important; opacity: 0.9 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; }' +
                '.iptv-channel-card .ch-icon { color: #D8B46A !important; font-size: 18px !important; font-weight: bold !important; transition: transform 0.2s ease !important; }' +
                
                '/* Состояние фокуса с пульта */' +
                '.iptv-channel-card.focus { background: linear-gradient(135deg, #F3D079, #D8B46A, #9E7D3B) !important; border-color: #FFFFFF !important; transform: scale(1.025) !important; box-shadow: 0 0 30px rgba(216, 180, 106, 0.6), 0 10px 30px rgba(0, 0, 0, 0.9) !important; }' +
                '.iptv-channel-card.focus .ch-title { color: #090A0D !important; text-shadow: none !important; }' +
                '.iptv-channel-card.focus .ch-group { color: #1a1a1c !important; font-weight: 700 !important; }' +
                '.iptv-channel-card.focus .ch-icon { color: #090A0D !important; transform: scale(1.2) !important; }' +
                '.iptv-channel-card.focus .logo-box { background: #FFFFFF !important; border-color: #FFFFFF !important; }' +
            '</style>'
        );
        $('head').append(style);
    }

    function openIPTVActivity() {
        Lampa.Activity.push({
            url: '',
            title: 'IPTV Каналы',
            component: 'iptv_country_component',
            page: 1
        });
    }

    function init() {
        injectStyles();

        // Добавление в меню
        function tryInjectMenu() {
            // Удаляем любые дубликаты и ошибочные вставки в нижние списки
            $('.menu__case.nosort [data-action="iptv_channels"]').remove();
            var existing = $('.menu [data-action="iptv_channels"]');
            if (existing.length > 1) {
                existing.slice(1).remove();
            }
            if (existing.length === 1) return;

            var firstList = $('.menu .menu__case:first-child .menu__list');
            if (!firstList.length) firstList = $('.menu .menu__list').first();
            if (!firstList.length) return;

            var menu_item = $(
                '<li class="menu__item selector" data-action="iptv_channels">' +
                    '<div class="menu__ico">' +
                        '<svg height="24" viewBox="0 0 24 24" width="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>' +
                    '</div>' +
                    '<div class="menu__text">ТВ Каналы</div>' +
                '</li>'
            );
            menu_item.on('hover:enter', function () {
                openIPTVActivity();
            });
            firstList.append(menu_item);
        }

        tryInjectMenu();

        if (window.Lampa && Lampa.Listener) {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') tryInjectMenu();
            });
        }

        // Компонент с корректным скроллом
        Lampa.Component.add('iptv_country_component', function () {
            var scroll = new Lampa.Scroll({ mask: false, over: true, step: 200 });
            var container = $('<div class="iptv-container"></div>');
            var navBar = $('<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 25px;"></div>');
            var list = $('<div style="display: flex; flex-direction: column; width: 100%;"></div>');
            var network = new Lampa.Reguest();
            var currentCountry = Lampa.Storage.get('iptv_last_country', 'ru');
            if (!COUNTRIES.some(function (c) { return c.code === currentCountry; })) {
                currentCountry = 'ru';
                Lampa.Storage.set('iptv_last_country', 'ru');
            }

            this.create = function () {
                scroll.minus();
                scroll.render().addClass('iptv-scroll-view');
                container.append(navBar);
                container.append(list);
                scroll.append(container);

                // Поддержка скролла колесиком мыши и тачпадом
                scroll.render().on('wheel', function (e) {
                    var oe = e.originalEvent || e;
                    var delta = oe.deltaY;
                    if (delta === undefined && oe.wheelDelta !== undefined) {
                        delta = -oe.wheelDelta;
                    }
                    if (delta) {
                        scroll.wheel(delta > 0 ? 250 : -250);
                        e.preventDefault();
                    }
                });

                this.buildCountries();
                this.loadCountry(currentCountry);

                return this.render();
            };

            this.buildCountries = function () {
                var _this = this;
                navBar.empty();

                COUNTRIES.forEach(function (c) {
                    var btn = $('<div class="iptv-btn-country selector">' + c.title + '</div>');
                    
                    if (c.code === currentCountry) {
                        btn.addClass('active-country');
                    }

                    btn.on('hover:focus', function () {
                        scroll.update($(this), true);
                    });

                    btn.on('hover:enter click', function () {
                        navBar.find('.active-country').removeClass('active-country');
                        btn.addClass('active-country');
                        currentCountry = c.code;
                        Lampa.Storage.set('iptv_last_country', c.code);
                        scroll.reset();
                        _this.loadCountry(c.code);
                    });

                    navBar.append(btn);
                });
            };

            this.loadCountry = function (countryCode) {
                var _this = this;
                _this.activity.loader(true);
                list.empty();

                var endpoint = countryCode === 'ru'
                    ? 'https://raw.githubusercontent.com/ngrch/iptv/main/ru.m3u'
                    : 'https://iptv-org.github.io/iptv/countries/' + countryCode + '.m3u';

                network.silent(endpoint, function (str) {
                    _this.activity.loader(false);
                    var channels = parseM3U(str, countryCode);

                    if (!channels.length) {
                        list.html('<div style="padding: 40px; text-align: center; color: #ffffff; font-size: 20px; font-weight: bold;">Каналы не найдены</div>');
                    } else {
                        _this.renderChannels(channels);
                    }

                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Layer.update();
                    setTimeout(function () {
                        Lampa.Layer.update();
                    }, 50);
                }, function () {
                    _this.activity.loader(false);
                    list.html('<div style="padding: 40px; text-align: center; color: #ff5555; font-size: 20px; font-weight: bold;">Ошибка загрузки плейлиста</div>');
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Layer.update();
                }, false, { dataType: 'text' });
            };

            this.renderChannels = function (channels) {
                list.empty();

                channels.forEach(function (ch) {
                    var card = $(
                        '<div class="iptv-channel-card selector">' +
                            '<div class="logo-box">' +
                                (ch.img ? '<img src="' + ch.img + '" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.style.display=\'none\'" />' : '<span style="font-size: 22px;">📺</span>') +
                            '</div>' +
                            '<div style="flex: 1; overflow: hidden; padding-right: 15px;">' +
                                '<div class="ch-title">' + ch.title + '</div>' +
                                (ch.group ? '<div class="ch-group">' + ch.group + '</div>' : '') +
                            '</div>' +
                            '<div class="ch-icon">▶</div>' +
                        '</div>'
                    );

                    // Центрирование экрана на выбранном канале
                    card.on('hover:focus', function () {
                        scroll.update($(this), true);
                    });

                    card.on('hover:enter click', function () {
                        Lampa.Player.play({
                            url: ch.url,
                            title: ch.title,
                            timeline: false
                        });

                        Lampa.Player.playlist(channels.map(function (item) {
                            return { title: item.title, url: item.url };
                        }));
                    });

                    list.append(card);
                });
            };

            this.render = function (js) {
                return scroll.render(js);
            };

            this.start = function () {
                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(scroll.render());
                        Lampa.Controller.collectionFocus(false, scroll.render());
                    },
                    left: function () {
                        if (Navigator.canmove('left')) Navigator.move('left');
                        else Lampa.Controller.toggle('menu');
                    },
                    right: function () {
                        if (Navigator.canmove('right')) Navigator.move('right');
                    },
                    up: function () {
                        if (Navigator.canmove('up')) Navigator.move('up');
                        else Lampa.Controller.toggle('head');
                    },
                    down: function () {
                        if (Navigator.canmove('down')) Navigator.move('down');
                    },
                    back: function () {
                        Lampa.Activity.backward();
                    }
                });

                Lampa.Controller.toggle('content');
            };

            this.pause = function () {};
            this.stop = function () {};
            this.destroy = function () {
                network.clear();
                scroll.destroy();
            };
        });
    }

    function parseM3U(data, countryCode) {
        var lines = data.split('\n');
        var items = [];
        var current = null;
        var seen = {};

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;

            if (line.indexOf('#EXTINF:') === 0) {
                var lastComma = line.lastIndexOf(',');
                var channelTitle = lastComma !== -1 ? line.substring(lastComma + 1).trim() : 'Без названия';
                var logoMatch = line.match(/tvg-logo="([^"]*)"/i);
                var groupMatch = line.match(/group-title="([^"]*)"/i);

                current = {
                    title: channelTitle,
                    img: logoMatch ? logoMatch[1] : '',
                    group: groupMatch ? groupMatch[1].trim() : '',
                    url: ''
                };
            } else if (line.indexOf('#') !== 0 && current) {
                current.url = line;

                // Фильтрация заведомо неработающих и блокирующих CORS потоков (Rutube, Smotrim и т.д.)
                var isBlocked = current.url.indexOf('bl.rutube.ru') !== -1 ||
                                current.url.indexOf('live.smotrim.ru') !== -1;

                if (!isBlocked && current.url) {
                    // Очистка от дублирующихся номерных зеркал вида "Первый (2)"
                    var cleanTitle = current.title.replace(/\s*\(\d+\)$/, '').trim().toLowerCase();
                    var isMirror = /\s*\(\d+\)$/.test(current.title);

                    if (!isMirror || !seen[cleanTitle]) {
                        seen[cleanTitle] = true;
                        items.push(current);
                    }
                }
                current = null;
            }
        }

        return items;
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
