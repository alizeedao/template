/**
 * This plugin is based on "GOOGLE GRID GALLERY"
 * and "ANIMATIONS FOR THUMBNAIL GRIDS" from Codrops.
 *
 * Free version of above scripts you can get from: http://tympanus.net/codrops
 *
 * -----------------------------------------------------------------------------
 *
 * !!! TerraNet copyright here... !!!
 *
 * -----------------------------------------------------------------------------
 */
(function() {
  'use strict';

  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this,
        args = arguments;

      clearTimeout(timeout);

      timeout = setTimeout(function() {
        timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      }, wait);

      if (immediate && !timeout) {
        func.apply(context, args);
      }
    };
  }

  var animEndEventNames = {
    'WebkitAnimation': 'webkitAnimationEnd',
    'OAnimation': 'oAnimationEnd',
    'msAnimation': 'MSAnimationEnd',
    'animation': 'animationend'
  };

  var transEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'oTransitionEnd',
    'msTransition': 'MSTransitionEnd',
    'transition': 'transitionend'
  };

  var CSS_TRANSITION_PROP = Modernizr.prefixed('transform');
  var EVENT_ANIMATION_END = animEndEventNames[Modernizr.prefixed('animation')];
  var EVENT_TRANSITION_END = transEndEventNames[CSS_TRANSITION_PROP];
  var EVENT_CLICK = Modernizr.touch ? 'touchstart' : 'click';

  var DATA_URL = 'data/gallery.json';
  var CLASS_GRID_WRAPPER = 'tt-grid-wrapper';
  var CLASS_GRID = 'tt-grid';
  var CLASS_CURRENT = 'tt-current';
  var CLASS_OLD = 'tt-old';
  var CLASS_EFFECT_ACTIVE = 'tt-effect-active';
  var CLASS_EMPTY = 'tt-empty';
  var CLASS_ZOMBIE = 'tt-zombie';
  var CLASS_IMG_IDLE = 'img-idle';
  var CLASS_PORTFOLIO_LOADING = 'portfolio-loading';
  var CLASS_PORTFOLIO_ERROR = 'portfolio-error';
  var CLASS_PORTFOLIO_EMPTY = 'portfolio-empty';

  var DIR_NEXT = 'next';
  var DIR_PREV = 'prev';

  var $w = $(window);
  var $d = $(document);

  var Gallery = function(element) {
    this.$wrapper = $(element)
      .addClass(CLASS_PORTFOLIO_LOADING);

    this.$grid = this.$wrapper
      .find('.' + CLASS_GRID)
      .addClass('tt-effect-3dflip tt-effect-delay');

    this.$items = this.$grid.find('li');
    this.$nav = this.$wrapper.find('.nav');

    this.pending_ = false;
    this.category_ = undefined;
    this.timeout_ = undefined;
    this.visibleItems_ = 0;
    this.isSlideshowVisible_ = false;
    this.slideshowPending_ = false;
    this.slideshowCurrent_ = -1;

    this.loadData();
  };

  Gallery.prototype = {
    data_: [],
    query_: null,
    initialized_: false,
    total: 0,

    init: function() {
      var that = this;

      this.createNav();
      this.slideshowCreate();
      this.createGridItems();

      this.$navLinks.on(EVENT_CLICK, function(ev) {
        ev.preventDefault();

        var category = $(this).data('category');

        if (that.pending_ || that.category_ === category) {
          return false;
        }

        that.pending_ = true;
        that.category_ = category;
        that.loadCategory(category);
      });

      // Slideshow
      this.$grid.on(EVENT_CLICK, 'li a', function() {
        var index = parseInt($(this).data('index'), 10);

        if (typeof index !== 'number' || isNaN(index)) {
          index = $(this).parent().index();
        }

        that.slideshowOpen(index);
      });

      this.$wrapper
        .on(EVENT_CLICK, '.nav-prev, .nav-next', function(event) {
          event.preventDefault();
          that.slideshowNavigate($(this).hasClass('nav-prev') ? DIR_PREV : DIR_NEXT);
        })
        .on(EVENT_CLICK, '.nav-close', function(event) {
          event.preventDefault();
          that.slideshowClose();
        });

      $d.on('keydown.gallery', function(event) {
        if (that.isSlideshowVisible_) {
          var key = event.keyCode || event.which;

          switch (key) {
            case 37:
              that.slideshowNavigate(DIR_PREV);
              break;
            case 39:
              that.slideshowNavigate(DIR_NEXT);
              break;
            case 27:
              that.slideshowClose();
              break;
          }
        }
      });

      var updateGridHeight = debounce(function() {
        that.setGridHeight();
      }, 250);

      $w
        .on('resize.gallery', updateGridHeight)
        .on('scroll', function() {
          if (that.isSlideshowVisible_) {
            window.scrollTo(that.scrollPosition_ ? that.scrollPosition_.x : 0, that.scrollPosition_ ? that.scrollPosition_.y : 0);
          } else {
            that.scrollPosition_ = {
              x: $w.scrollLeft(),
              y: $w.scrollTop()
            };
          }
        });

      this.loadCategory('all');
    },

    loadData: function() {
      var that = this;

      if (this.query_) {
        return;
      }

      this.query_ = $.getJSON(DATA_URL, function(data) {
        if ($.isArray(data)) {
          that.data_ = $.map(data, function(category) {
            category.count = category.works.length;
            that.total += category.count;
            return category;
          });

          that.init();
        } else {
          that.$wrapper.addClass(CLASS_PORTFOLIO_EMPTY);
        }
      });

      this.query_.fail(function() {
        that.$wrapper.addClass(CLASS_PORTFOLIO_ERROR);
      });

      this.query_.always(function() {
        that.query_ = null;
        that.$wrapper.removeClass(CLASS_PORTFOLIO_LOADING);
      });
    },

    /**
     * @param {string} category
     */
    loadCategory: function(category) {
      if (category === 'all') {
        var newImages = [];
        $.each(this.data_, function(i, c) {
          newImages = newImages.concat(c.works);
        });
      } else {
        $.each(this.data_, function(i, c) {
          if (category === c.slug) {
            newImages = c.works;
            return false;
          }
        });
      }

      this.visibleItems_ = newImages.length;

      if (this.initialized_) {
        this.$items
          .children('a')
          .addClass(CLASS_OLD);
      }

      if (newImages.length) {
        this.$navLinks
          .filter('[data-category="' + category + '"]')
          .addClass(CLASS_CURRENT)
          .siblings('.' + CLASS_CURRENT)
          .removeClass(CLASS_CURRENT);
      }

      var that = this;

      var onEndFx = function() {
        that.$items
          .find('.' + CLASS_OLD)
          .remove()
          .end()
          .removeClass(CLASS_EMPTY)
          .filter(function() {
            return !$(this).children().length;
          })
          .addClass(CLASS_EMPTY);

        that.$grid.removeClass(CLASS_EFFECT_ACTIVE);
        that.pending_ = false;
        that.initialized_ = true;
      };

      this.timeout_ = setTimeout(function() {
        var $items = [];
        var slideshowItems = [];

        that.setGridHeight();

        that.$items.each(function(i, el) {
          var item = newImages[i];

          if (item) {
            var attributes = [
              'alt="' + item.title + '"',
              'class="img-responsive ' + CLASS_IMG_IDLE + '"',
              'src="img/space.png"',
              'data-src="' + item.thumb + '"'
            ];

            if (item.thumb_2x) {
              attributes.push('data-src-retina="' + item.thumb_2x + '"');
            }

            el.innerHTML += '<a href="#" data-index="' + i + '"><img ' + attributes.join(' ') + '></a>';

            $items.push(el);

            // Slideshow
            attributes = [
              'class="' + CLASS_IMG_IDLE + '"',
              'alt="' + item.title + '"',
              'src="img/space.png"',
              'data-src="' + item.preview + '"'
            ];

            if (item.preview_2x) {
              attributes.push('data-src-retina="' + item.preview_2x + '"');
            }

            slideshowItems.push([
              '<li>',
              '<figure>',
              '<figcaption>',
              '<h3>' + item.title + '</h3>',
              '<p>' + item.description + '</p>',
              '</figcaption>',
              '<img ' + attributes.join(' ') + '>',
              '</figure>',
              '</li>'
            ].join("\n"));
          }
        });

        that.$slideshowContainer.empty().append(slideshowItems.join("\n"));
        that.$slideshowItems = that.$slideshowContainer.children('li');
        that.$wrapper.find('img.' + CLASS_IMG_IDLE).unveil(10, function() {
          $(this).load(function() {
            $(this).removeClass(CLASS_IMG_IDLE);
          });
        });

        setTimeout(function() {
          $w.trigger('lookup.unveil');
        }, 0);

        if (that.initialized_) {
          that.$grid.addClass(CLASS_EFFECT_ACTIVE);

          if (Modernizr.cssanimations) {
            var total = $items.length;
            var finished = 0;

            $($items).one(EVENT_ANIMATION_END, function() {
              ++finished;
              if (finished === total) {
                onEndFx.call();
              }
            });
          } else {
            onEndFx.call();
          }
        } else {
          onEndFx.call();
        }

        clearTimeout(that.timeout_);
        that.timeout_ = undefined;
      }, 25);
    },

    setGridHeight: function() {
      var cols = Math.round(this.$grid.width() / this.$items.eq(0).outerWidth(true));
      var height = this.$items.eq(0).outerHeight(true) * Math.ceil((this.visibleItems_ + 1) / cols);

      if (this.lastGridHeight_ !== height) {
        this.$grid.height(this.lastGridHeight_ = height);
      }
    },

    createGridItems: function() {
      var items = ['<li class="' + CLASS_ZOMBIE + '"><li/>'];
      var i = this.data_.length;
      var max = 0;

      while (i--) {
        max += this.data_[i].works.length;
      }

      while (max--) {
        items.push('<li class="' + CLASS_EMPTY + '"></li>');
      }

      this.$grid.append(items.join("\n"));
      this.$items = this.$grid.find('li').not('.' + CLASS_ZOMBIE);
    },

    createNav: function() {
      var links = [];

      links.push('<a href="#all" data-category="all"><span class="badge pull-right">' + this.total + '</span>All</a>');

      $.each(this.data_, function(i, c) {
        links.push('<a href="#' + c.slug + '" data-category="' + c.slug + '">' +
          '<span class="badge pull-right">' + c.count + '</span>' + c.name + '</a>');
      });

      this.$nav.empty().append(links.join("\n"));
      this.$navLinks = this.$nav.children('a');
    },

    slideshowCreate: function() {
      this.$slideshow = $([
        '<section class="gallery-slideshow">',
        '<ul>',
        '</ul>',
        '<nav class="gallery-slideshow-nav">',
        '<span class="icon nav-prev"></span>',
        '<span class="icon nav-next"></span>',
        '<span class="icon nav-close"></span>',
        '</nav>',
        '<div class="gallery-slideshow-info icon">Navigate with arrow keys</div>',
        '</section>'
      ].join("\n"));

      this.$slideshowContainer = this.$slideshow.children('ul');
      this.$slideshowNav = this.$slideshow.find('.gallery-slideshow-info');
      this.$grid.after(this.$slideshow);
    },

    slideshowOpen: function(index) {
      this.isSlideshowVisible_ = true;
      this.slideshowCurrent_ = index;

      this.$wrapper.addClass('gallery-slideshow-open');

      this.slideshowSetViewportItems();
      this.$slideshowCurrentItem.addClass('current show');

      var pos;
      var viewportWidth = $w.width();

      if (this.$slideshowPrevItem) {
        this.$slideshowPrevItem.addClass('show');
        pos = Number(-1 * (viewportWidth / 2 + this.$slideshowPrevItem.offset().left / 2));
        this.$slideshowPrevItem.css(CSS_TRANSITION_PROP, Modernizr.csstransforms3d ? 'translate3d(' + pos + 'px,0,-150px)' : 'translate(' + pos + 'px)');
      }

      if (this.$slideshowNextItem) {
        this.$slideshowNextItem.addClass('show');
        pos = Number(viewportWidth / 2 + this.$slideshowNextItem.offset().left / 2);
        this.$slideshowNextItem.css(CSS_TRANSITION_PROP, Modernizr.csstransforms3d ? 'translate3d(' + pos + 'px,0,-150px)' : 'translate(' + pos + 'px)');
      }
    },

    slideshowClose: function() {
      this.$wrapper.removeClass('gallery-slideshow-open');
      this.$slideshowContainer.removeClass('animatable');

      var that = this;
      var onEndTransitionFn = function(event) {
        that.$slideshowCurrentItem.removeClass('current');
        that.$slideshowCurrentItem.removeClass('show');

        if (that.$slideshowPrevItem) {
          that.$slideshowPrevItem.removeClass('show');
        }

        if (that.$slideshowNextItem) {
          that.$slideshowNextItem.removeClass('show');
        }

        that.$slideshowItems.css(CSS_TRANSITION_PROP, '');
        that.isSlideshowVisible_ = false;
      };

      if (Modernizr.csstransitions) {
        this.$wrapper.one(EVENT_TRANSITION_END, onEndTransitionFn);
      } else {
        onEndTransitionFn();
      }
    },

    slideshowNavigate: function(dir) {
      if (this.slideshowPending_) {
        return;
      }

      if (dir === DIR_NEXT && this.slideshowCurrent_ === this.visibleItems_ - 1 || dir === DIR_PREV && this.slideshowCurrent_ === 0) {
        this.slideshowClose();
        return;
      }

      this.slideshowPending_ = true;
      this.slideshowSetViewportItems();

      var itemWidth = this.$slideshowCurrentItem.offset().left;
      var viewportWidth = $w.width();
      var transformLeftProp = Modernizr.csstransforms3d ? 'translate3d(-' + Number(viewportWidth / 2 + itemWidth / 2) + 'px,0,-150px)' : 'translate(-' + Number(viewportWidth / 2 + itemWidth / 2) + 'px)';
      var transformRightProp = Modernizr.csstransforms3d ? 'translate3d(' + Number(viewportWidth / 2 + itemWidth / 2) + 'px,0,-150px)' : 'translate(' + Number(viewportWidth / 2 + itemWidth / 2) + 'px)';
      var transformCenterProp = '';
      var transformOutProp;
      var transformIncomingProp;
      var $incomingItem;

      if (dir === DIR_NEXT) {
        transformOutProp = Modernizr.csstransforms3d ? 'translate3d(-' + Number((viewportWidth * 2) / 2 + itemWidth / 2) + 'px,0,-150px )' : 'translate(-' + Number((viewportWidth * 2) / 2 + itemWidth / 2) + 'px)';
        transformIncomingProp = Modernizr.csstransforms3d ? 'translate3d(' + Number((viewportWidth * 2) / 2 + itemWidth / 2) + 'px,0,-150px )' : 'translate(' + Number((viewportWidth * 2) / 2 + itemWidth / 2) + 'px)';
      } else {
        transformOutProp = Modernizr.csstransforms3d ? 'translate3d(' + Number((viewportWidth * 2) / 2 + itemWidth / 2) + 'px, 0,-150px )' : 'translate(' + Number((viewportWidth * 2) / 2 + itemWidth / 2) + 'px)';
        transformIncomingProp = Modernizr.csstransforms3d ? 'translate3d(-' + Number((viewportWidth * 2) / 2 + itemWidth / 2) + 'px,0,-150px )' : 'translate(-' + Number((viewportWidth * 2) / 2 + itemWidth / 2) + 'px)';
      }

      this.$slideshowContainer.removeClass('animatable');

      if (dir === DIR_NEXT && this.slideshowCurrent_ < this.visibleItems_ - 2 || dir === DIR_PREV && this.slideshowCurrent_ > 1) {
        $incomingItem = this.$slideshowItems.eq(dir === DIR_NEXT ? this.slideshowCurrent_ + 2 : this.slideshowCurrent_ - 2);
        $incomingItem
          .css(CSS_TRANSITION_PROP, transformIncomingProp)
          .addClass('show');
      }

      var that = this;

      var slide = function() {
        that.$slideshowContainer.addClass('animatable');
        that.$slideshowCurrentItem.removeClass('current');

        var $nextCurrent = dir === DIR_NEXT ? that.$slideshowNextItem : that.$slideshowPrevItem;

        $nextCurrent.addClass('current');

        that.$slideshowCurrentItem.css(CSS_TRANSITION_PROP, dir === DIR_NEXT ? transformLeftProp : transformRightProp);

        if (that.$slideshowNextItem) {
          that.$slideshowNextItem.css(CSS_TRANSITION_PROP, dir === DIR_NEXT ? transformCenterProp : transformOutProp);
        }

        if (that.$slideshowPrevItem) {
          that.$slideshowPrevItem.css(CSS_TRANSITION_PROP, dir === DIR_NEXT ? transformOutProp : transformCenterProp);
        }

        if ($incomingItem) {
          $incomingItem.css(CSS_TRANSITION_PROP, dir === DIR_NEXT ? transformRightProp : transformLeftProp);
        }

        var onEndTransitionFn = function(event) {
          if (that.$slideshowPrevItem && dir === DIR_NEXT) {
            that.$slideshowPrevItem.removeClass('show');
          } else if (that.$slideshowNextItem && dir === DIR_PREV) {
            that.$slideshowNextItem.removeClass('show');
          }

          if (dir === DIR_NEXT) {
            that.$slideshowPrevItem = that.$slideshowCurrentItem;
            that.$slideshowCurrentItem = that.$slideshowNextItem;

            if ($incomingItem) {
              that.$slideshowNextItem = $incomingItem;
            }
          } else {
            that.$slideshowNextItem = that.$slideshowCurrentItem;
            that.$slideshowCurrentItem = that.$slideshowPrevItem;

            if ($incomingItem) {
              that.$slideshowPrevItem = $incomingItem;
            }
          }

          that.slideshowCurrent_ = dir === DIR_NEXT ? that.slideshowCurrent_ + 1 : that.slideshowCurrent_ - 1;
          that.slideshowPending_ = false;
        };

        if (Modernizr.csstransitions) {
          that.$slideshowCurrentItem.one(EVENT_TRANSITION_END, onEndTransitionFn);
        } else {
          onEndTransitionFn();
        }
      };

      this.slideshowTimeout_ = setTimeout(slide, 25);
    },

    slideshowSetViewportItems: function() {
      this.$slideshowCurrentItem = null;
      this.$slideshowPrevItem = null;
      this.$slideshowNextItem = null;

      if (this.slideshowCurrent_ > 0) {
        this.$slideshowPrevItem = this.$slideshowItems.eq(this.slideshowCurrent_ - 1);
      }

      if (this.slideshowCurrent_ < this.visibleItems_ - 1) {
        this.$slideshowNextItem = this.$slideshowItems.eq(this.slideshowCurrent_ + 1);
      }

      this.$slideshowCurrentItem = this.$slideshowItems.eq(this.slideshowCurrent_);
    }
  };

  $('.' + CLASS_GRID_WRAPPER).each(function() {
    if (!$.data(this, 'Gallery')) {
      $.data(this, 'Gallery', new Gallery(this));
    }
  });
})();