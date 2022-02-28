import Api from './utils/api';
import Debounce from './utils/debounce';

class AdvancedPagination {
  constructor(module = document) {
    //Pagination
    this.module = module;
    this.paginator = module.querySelector('.js-post-pagination');
    this.postType = this.paginator.getAttribute('post_type')
    this.postsContainer = this.paginator.querySelector('.js-posts');
    this.currentPage = parseInt(this.postsContainer.getAttribute('page'));
    this.pages = parseInt(this.postsContainer.getAttribute('pages'));
    this.loaderColor = this.postsContainer.getAttribute('loader_color');
    this.postsPerPage = parseInt(this.postsContainer.getAttribute('posts_per_page'));
    this.component = this.postsContainer.getAttribute('component');
    this.controllers = this.paginator.querySelector('.js-pagination-controllers');
    this.nothingFoundMessage = this.paginator.getAttribute('no_results_message');
    this.arrows;
    this.pageNumbersContainer;
    this.pageNumbers;
    this.pageNumbersLimit;

    //Filters
    this.taxonomiesBoxes = module.querySelectorAll('.js-posts-taxonomy');
    this.currentFilters = [];

    //Search
    this.searchInput = module.querySelector('.js-search-posts');
    this.searchValue = '';

    //Page Arguments
    this.href = window.location.href;

    this.init();
  }

  init() {
    if (this.setupControllerVars()) {
      this.arrowsClick();
      this.pageNumbersClick();
      this.pageNumbersLimiter();
    }

    this.checkArrowStatus();
    this.filters();
    this.searchPosts();
  }

  setupControllerVars() {
    if (this.pages > 1) {
      this.arrows = {
        prev: this.paginator.querySelector('.js-back'),
        next: this.paginator.querySelector('.js-next')
      }
      this.pageNumbersContainer = this.paginator.querySelector('.js-pages');
      this.pageNumbers = this.paginator.querySelectorAll('.js-page');
      this.pageNumbersLimit = parseInt(this.pageNumbersContainer.getAttribute('limit'))
      return true;
    } else {
      return false;
    }
  }

  arrowsClick() {
    //Arrows or next, prev function
    const self = this;
    this.arrows.next.addEventListener('click', () => {
      if (self.currentPage < self.pages) {
        self.currentPage++;
        self.findCurrentButtonPage();
        self.postsContainer.setAttribute('page', self.currentPage);
        self.checkArrowStatus();
        self.call();
      }
    });

    this.arrows.prev.addEventListener('click', () => {
      if (self.currentPage > 1) {
        self.currentPage--;
        self.findCurrentButtonPage();
        self.postsContainer.setAttribute('page', self.currentPage);
        self.checkArrowStatus();
        self.call();
      }
    });
  }

  findCurrentButtonPage() {
    this.pageNumbers.forEach(button => {
      button.classList.remove('active');

      if (button.getAttribute('page') == this.currentPage) {
        button.classList.add('active');
      }
    })
  }

  pageNumbersClick() {
    const self = this;

    this.pageNumbers.forEach(button => {
      button.addEventListener('click', () => {
        if (self.currentPage != parseInt(button.getAttribute('page'))) {
          self.pageNumbers.forEach(btn => {
            btn.classList.remove('active');
          })
          button.classList.add('active');
          self.currentPage = parseInt(button.getAttribute('page'));
          self.checkArrowStatus();
          self.call();
        }
      })
    });
  }

  checkArrowStatus() {
    try {
      //Prev arrow
      if (this.currentPage == 1) {
        this.arrows.prev.classList.add('disabled')
      } else {
        this.arrows.prev.classList.remove('disabled')
      }

      //Next arrow
      if (this.currentPage == this.pages) {
        this.arrows.next.classList.add('disabled')
      } else {
        this.arrows.next.classList.remove('disabled')
      }
    } catch {}
  }

  pageNumbersLimiter() {
    try {
      const from = this.currentPage - this.pageNumbersLimit <= 1 ? 0 : this.currentPage - this.pageNumbersLimit;
      const to = this.currentPage + this.pageNumbersLimit >= this.pages ? this.pages : this.currentPage + this.pageNumbersLimit;
      let firstHiddenBtn = true;

      this.pageNumbers.forEach(btn => {
        if (parseInt(btn.getAttribute('page')) < from || parseInt(btn.getAttribute('page')) > to) {
          btn.classList.add('hidden')

          if (firstHiddenBtn) {
            firstHiddenBtn = false;
            if (parseInt(btn.getAttribute('page')) < from) {
              this.pageNumbersContainer.classList.add('has-prev-hidden-buttons')
            } else {
              this.pageNumbersContainer.classList.remove('has-prev-hidden-buttons')
            }
          }

          if (parseInt(btn.getAttribute('page')) > to) {
            this.pageNumbersContainer.classList.add('has-next-hidden-buttons')
          } else {
            this.pageNumbersContainer.classList.remove('has-next-hidden-buttons');
          }

        } else {
          btn.classList.remove('hidden')
        }
      })
    } catch {}
  }

  scrollTop() {
    window.scrollTo({
      top: this.module.offsetTop - document.querySelector('header').clientHeight,
      behavior: 'smooth'
    });
  }

  setUrl() {
    //Pagination
    const pagePost = [{
      name: this.postType + '-page',
      value: this.currentPage
    }]

    //Filters
    this.currentFilters.forEach(filter => {
      if (filter.term != 'all') {
        pagePost.push({
          name: filter.taxonomy,
          value: filter.term
        })
      }
    })

    //Search
    if (this.searchValue != '') {
      pagePost.push({
        name: 'search',
        value: this.searchValue
      });
    }

    let fullArgs = '';
    pagePost.forEach((args, key) => {

      fullArgs += key == pagePost.length - 1 ? `${args.name}=${args.value}` : `${args.name}=${args.value}&`;
    })

    //Add args
    window.history.pushState("", "", `?${fullArgs}`);
  }

  loader() {
    this.postsContainer.classList.add('loading');
    this.postsContainer.innerHTML = '<div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>'
    if (!document.querySelector('#loader-ajax-posts')) {
      const style = document.createElement('style');
      style.setAttribute('id', 'loader-ajax-posts')
      style.textContent = `
            .lds-roller {
                display: block;
                position: relative;
                width: 80px;
                height: 80px;
                margin: 50px auto;
              }
              .lds-roller div {
                animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
                transform-origin: 40px 40px;
                
              }
              .lds-roller div:after {
                content: " ";
                display: block;
                position: absolute;
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background-color: ${this.loaderColor};
                margin: -4px 0 0 -4px;
              }
              .lds-roller div:nth-child(1) {
                animation-delay: -0.036s;
              }
              .lds-roller div:nth-child(1):after {
                top: 63px;
                left: 63px;
              }
              .lds-roller div:nth-child(2) {
                animation-delay: -0.072s;
              }
              .lds-roller div:nth-child(2):after {
                top: 68px;
                left: 56px;
              }
              .lds-roller div:nth-child(3) {
                animation-delay: -0.108s;
              }
              .lds-roller div:nth-child(3):after {
                top: 71px;
                left: 48px;
              }
              .lds-roller div:nth-child(4) {
                animation-delay: -0.144s;
              }
              .lds-roller div:nth-child(4):after {
                top: 72px;
                left: 40px;
              }
              .lds-roller div:nth-child(5) {
                animation-delay: -0.18s;
              }
              .lds-roller div:nth-child(5):after {
                top: 71px;
                left: 32px;
              }
              .lds-roller div:nth-child(6) {
                animation-delay: -0.216s;
              }
              .lds-roller div:nth-child(6):after {
                top: 68px;
                left: 24px;
              }
              .lds-roller div:nth-child(7) {
                animation-delay: -0.252s;
              }
              .lds-roller div:nth-child(7):after {
                top: 63px;
                left: 17px;
              }
              .lds-roller div:nth-child(8) {
                animation-delay: -0.288s;
              }
              .lds-roller div:nth-child(8):after {
                top: 56px;
                left: 12px;
              }
              @keyframes lds-roller {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `;
      document.head.append(style);
    }
  }

  filters() {
    const self = this;
    this.taxonomiesBoxes.forEach(taxonomy => {
      const current = taxonomy.querySelector('.js-current-taxonomy');
      const taxonomyTerms = taxonomy.querySelectorAll('.js-taxonomy-option');
      const dropdown = current.parentElement.querySelector('.js-taxonomies-options');

      this.currentFilters.push({
        taxonomy: taxonomy.getAttribute('taxonomy'),
        term: 'all'
      })

      current.addEventListener('click', () => {
        dropdown.classList.toggle('open')
      })

      taxonomyTerms.forEach(term => {
        term.addEventListener('click', () => {
          //Close dropdown
          dropdown.classList.toggle('open')

          //Change current filter
          current.querySelector('.js-current-taxname').innerHTML = term.innerHTML;
          self.currentFilters.filter(filter => filter.taxonomy == term.getAttribute('taxonomy'))[0].term = term.getAttribute('term');
          self.currentPage = 1;
          self.call(true);
        })
      })

    });
  }

  searchPosts() {
    if (this.searchInput) {
      new Debounce({
        input: this.searchInput,
        time: 300,
        doneFunction: (value) => {
          this.searchValue = value;
          this.currentPage = 1;
          this.call(true);
        }
      })
    }
  }

  refreshController(reloadController, response) {
    try {
      if (reloadController) {

        if (response.data.controllers) {
          this.controllers.innerHTML = response.data.controllers;
        } else {
          this.controllers.innerHTML = '';
        }

        this.pages = parseInt(response.data.pages);
        this.postsContainer.setAttribute('page', '1')
        this.currentPage = 1;

        if (this.setupControllerVars()) {
          this.arrowsClick();
          this.pageNumbersClick();
          this.pageNumbersLimiter();
        }
      }
    } catch {}
  }

  call(reloadController = false) {
    this.scrollTop();
    this.setUrl();
    this.loader();
    this.pageNumbersLimiter();

    Api.get('post-powers/v1/paged-posts', {
        params: {
          post_type: this.postType,
          page: this.currentPage,
          posts_per_page: this.postsPerPage,
          component: this.component,
          filters: this.currentFilters,
          search: this.searchValue,
          next_controller_button: this.paginator.getAttribute('next'),
          prev_controller_button: this.paginator.getAttribute('prev'),
          controller_limit_button: this.paginator.getAttribute('limit'),
          no_results_message: this.nothingFoundMessage
        }
      })
      .then(response => {
        this.postsContainer.classList.remove('loading');
        if(response.data.status){
          this.postsContainer.innerHTML = response.data.posts;
          this.postsContainer.classList.remove('nothing-found');
        }else{
          this.postsContainer.innerHTML = response.data.message;
          this.postsContainer.classList.add('nothing-found');
        }
        this.refreshController(reloadController, response);
      })
      .catch(error => {
        this.postsContainer.innerHTML = 'Opss! Something goes wrong...';
        console.log(error);
      });
  }
}

new AdvancedPagination();