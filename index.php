<?php

/**
 * Plugin Name: Advanced Archive
 * Description: A Simple plugin for improve your archive experience
 * Version: 1.0.0
 * Author: Facundo Gamond
 * Author URI: https://facundogamond.com.ar
 * Text Domain: advancedarchive
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) exit; // Exit if accessed directly

class AdvancedArchive
{
    function __construct()
    {
        add_action('admin_menu', array($this, 'ourMenu'));
        add_shortcode('advanced-archive', array($this, 'printArchive'));
        add_action('rest_api_init', array($this, 'registerEndpoint'));
    }

    function ourMenu()
    {
        add_menu_page('Advanced Archive', 'Advanced Archive', 'manage_options', 'advancedarchive', array($this, 'advancedArchivePage'), 'dashicons-superhero-alt', 100);
        add_submenu_page('ourwordfilter', 'Advanced Archive', 'Advanced Archive', 'manage_options', 'advancedarchive', array($this, 'advancedArchivePage'));
    }

    function advancedArchivePage()
    { ?>
        <div class="wrap advanced-archive">
            <h1>Advanced Archive</h1>
            <p>This is a simple wordpress plugin to get a full archive experience.</p>
            <h2>Features</h2>
            <ul>
                <li>Ajax data return (no reload required)</li>
                <li>Filters by Taxonomies</li>
                <li>Pagination</li>
                <li>Search Box</li>
                <li>URL params for easy share</li>
            </ul>
            <h3>Usage</h3>
            <p>Just paste in your post/page text editor this shortcode: [advanced-archive]</p>
            <p>You can customize yur layourt passing a few arguments:</p>
            <ul>
                <li>post_type -> Set your post type archive.</li>
                <li>posts_per_page -> Set limit of posts per page.</li>
                <li>component -> Set your own post component by creating a file in your theme:
                    <ul>
                        <li>Create a directory into your theme called advanced-archive/cards</li>
                        <li>Create your onw php component here</li>
                        <li>Copy the file name and use it in your shortcode</li>
                    </ul>
                </li>
            </ul>
            <span>example: [advanced-archive post_type="post" posts_per_page="8" component="test"]</span>
        </div>

        <style>
            .advanced-archive ul {
                list-style: disc;
                padding-left: 20px;
            }
        </style>
<?php }

    function printArchive($atts)
    {

        if (!is_admin()) {
            wp_enqueue_script('advanced-archive-functions', plugins_url('/assets/build/advanced-archive.min.js', __FILE__), array());
            wp_enqueue_style('advanced-archive-styles', plugins_url('/assets/build/advanced-archive.min.css', __FILE__));
            wp_localize_script('advanced-archive-functions', 'advancedArchive', array(
                'rootapiurl' => esc_url_raw(rest_url()),
                'nonce' => wp_create_nonce('wp_rest')
            ));
        }

        $opt = array(
            'post_type' => $atts['post_type'] ? $atts['post_type'] : get_post_type(),
            'posts_per_page' => $atts['posts_per_page'] ? intval($atts['posts_per_page']) : 4,
            'component' => $atts['component'] ? $atts['component'] : 'false',
            'no_results_message' => __('Nothing Found...', 'advancedarchive'),
            'next_button' => 'Next >',
            'prev_button' => '< Prev',
            'loader_color' => '#444',
            'numbers_limit' => 3,
            'search' => true,
            'search_opt' => array(
                'placeholder' => __('Search...', 'advancedarchive'),
                'append' => ''
            ),
            'filters' => true,
            'filters_opt' => array(
                'preppend' => __('Sort by ', 'advancedarchive'),
                'append' => file_get_contents(plugins_url('/assets/img/dropdown.svg', __FILE__)),
                'title' => true
            )
        );

        $post_type = $opt['post_type'];
        $component = $opt['component'];
        $nextBtn = $opt['next_button'];
        $prevBtn = $opt['prev_button'];
        $currentPage = isset($_GET[$post_type . '-page']) ? intval($_GET[$post_type . '-page']) : 1;
        $loaderColor = $opt['loader_color'];
        $numbersLimit = $opt['numbers_limit'];
        $postsPerPage = $opt['posts_per_page'];
        $noResultsMessage = $opt['no_results_message'];

        //HTTP filters
        $taxonomies = get_object_taxonomies('post', 'names');
        $taxFilters = array('relation' => 'AND');
        foreach ($taxonomies as $taxonomy) {
            if (isset($_GET[$taxonomy]) && $_GET[$taxonomy] != 'all') {
                $taxonomy = array(
                    'taxonomy' => $taxonomy,
                    'field' => 'slug',
                    'terms' => $_GET[$taxonomy]
                );
                array_push($taxFilters, $taxonomy);
            }
        }

        //WP Query.
        $args = [
            'post_type' => $post_type,
            'posts_per_page' => $postsPerPage,
            'post_status' => 'publish',
            'paged' => $currentPage,
            'tax_query' => $taxFilters,
            's' => isset($_GET['search']) ? $_GET['search'] : ''
        ];
        $posts = new WP_Query($args);

        //First posts.
        $postsData = '';

        if ($posts->have_posts()) {
            while ($posts->have_posts()) {
                $posts->the_post();
                ob_start();
                set_query_var('newpost', get_post());
                if ($component != 'false') {
                    get_template_part('advanced-archive/cards/' . $component);
                } else {
                    include('inc/default/post-template.php');
                }
                $postsData .= ob_get_contents();
                ob_end_clean();
            }
            wp_reset_postdata();
        } else {
            $postsData = $opt['no_results_message'];
        }

        //Buttons for pages.
        $pages = $posts->max_num_pages;
        $buttonsPages = '';
        for ($i = 1; $i <= $pages; $i++) {
            if ($i == $currentPage) {
                $buttonsPages .= "<button class='js-page page active' page='$i'>$i</button>";
            } else {
                $buttonsPages .= "<button class='js-page page' page='$i'>$i</button>";
            }
        }

        //Search
        $inputPlaceholder = __($opt['search_opt']['placeholder'], 'wcanvas-boilerplate');
        $inputAppendElement = $opt['search_opt']['append'];
        $search = !$opt['search'] ? '' : "<div class='c-pagination__search'>
        <input class='js-search-posts' type='text' placeholder='$inputPlaceholder'>
        $inputAppendElement
        </div>";

        //Filters
        if (gettype($opt['filters']) == 'boolean' && $opt['filters']) {
            $opt['filters'] = get_object_taxonomies($post_type, 'names');
        }
        $filters = "<div class='c-pagination__filters'>";
        if ($opt['filters']) {
            foreach ($opt['filters'] as $filter) {
                if ($filter != 'post_format') {

                    $terms = get_terms([
                        'taxonomy' => $filter,
                        'hide_empty' => false
                    ]);

                    $filterOptions = "<li class='c-pagination__filter-option js-taxonomy-option' taxonomy='$filter' term='all'>All</li>";
                    foreach ($terms as $term) {
                        $termSlug = $term->slug;
                        $termName = $term->name;
                        $filterOptions .= "<li class='c-pagination__filter-option js-taxonomy-option' taxonomy='$filter' term='$termSlug'>$termName</li>";
                    }

                    $filterPreppend = $opt['filters_opt']['preppend'] ? "<span class='c-pagination__filter-preppend'>" . $opt['filters_opt']['preppend'] . "</span>" : '';
                    $filterAppend = $opt['filters_opt']['append'] ? "<span class='c-pagination__filter-append'>" . $opt['filters_opt']['append'] . "</span>" : '';
                    $filterTitle = $opt['filters_opt']['title'] ? "<span class='c-pagination__filter-title'>" . get_taxonomy($filter)->label . "</span>" : '';

                    $currentTerm = isset($_GET[$filter]) ? $_GET[$filter] : __('All', 'wcanvas-boilerplate');
                    $filterBox = "<div class='c-pagination__filter js-posts-taxonomy' taxonomy='$filter'>
                    $filterTitle
                    <div class='c-pagination__filter-current js-current-taxonomy'>$filterPreppend<span class='js-current-taxname'>$currentTerm</span>$filterAppend</div>
                    <ul class='c-pagination__filter-options js-taxonomies-options'>
                    $filterOptions
                    </ul>
                    </div>";

                    $filters .= $filterBox;
                }
            }
        }
        $filters .= "</div>";

        //Controllers
        $controller = $posts->max_num_pages <= 1 ? '' : "<div class='c-pagination__controllers js-pagination-controllers'>
        <button class='js-back prev-page disabled'>$prevBtn</button>
        <div class='c-pagination__pages js-pages' limit='$numbersLimit'>$buttonsPages</div>
        <button class='js-next next-page'>$nextBtn</button>
        </div>";

        //Print pagination ajax.
        echo "<div class='c-pagination js-post-pagination' post_type='$post_type' prev='$prevBtn' next='$nextBtn' limit='$numbersLimit' no_results_message='$noResultsMessage'>
        $filters
        $search
        <div class='c-pagination__container js-posts' posts_per_page='$postsPerPage' page='$currentPage' pages='$pages' component='$component' loader_color='$loaderColor'>
            $postsData
        </div>
        $controller
        </div>";
    }

    function registerEndpoint()
    {
        register_rest_route('post-powers/v1', 'paged-posts', array(
            'methods' => WP_REST_SERVER::READABLE,
            'callback' => array($this, 'responseEndpoint')
        ));
    }

    function responseEndpoint($data)
    {
        //Get parammeters
        $post_type = $data['post_type']; //Post type
        $page = $data['page'];
        $postsPerPage = intval($data['posts_per_page']);
        $component = $data['component'];
        $paged = get_query_var('paged', $page);
        $filtersSettings = $data['filters'];
        $search = $data['search'];
        $controllerNext = $data['next_controller_button'];
        $controllerPrev = $data['prev_controller_button'];
        $controllerLimitNumbers = $data['controller_limit_button'];
        $noResultsMessage = $data['no_results_message'];

        //Filters
        $filters = array('relation' => 'AND');
        foreach ($filtersSettings as $filter) {
            $decodedFilter = json_decode($filter, true);
            if ($decodedFilter['term'] != 'all') {
                $taxonomy = array(
                    'taxonomy' => $decodedFilter['taxonomy'],
                    'field' => 'slug',
                    'terms' => array($decodedFilter['term'])
                );
                array_push($filters, $taxonomy);
            }
        }

        //WP Query
        $args = [
            'post_type' => $post_type,
            'posts_per_page'   => $postsPerPage,
            'post_status' => 'publish',
            'paged' => $paged,
            'order' => 'DESC',
            'tax_query' => $filters,
            's' => $search
        ];
        $full_posts = new WP_Query($args);

        //Pagination controllers changes on filter or search
        $pages = $full_posts->max_num_pages;
        if ($pages > 1) {
            $buttonsPages = '';
            for ($i = 1; $i <= $pages; $i++) {
                if ($i == intval($page)) {
                    $buttonsPages .= "<button class='js-page page active' page='$i'>$i</button>";
                } else {
                    $buttonsPages .= "<button class='js-page page' page='$i'>$i</button>";
                }
            }

            $controller = $full_posts->max_num_pages <= 1 ? '' : "<button class='js-back prev-page disabled'>$controllerPrev</button>
                <div class='c-pagination__pages js-pages' limit='$controllerLimitNumbers'>$buttonsPages</div>
                <button class='js-next next-page'>$controllerNext</button>";
        } else {
            $controller = false;
        }

        //Parse php posts into txt
        $postsTxt = array();
        $postData = '';
        while ($full_posts->have_posts()) {
            $full_posts->the_post();
            ob_start();
            set_query_var('newpost', get_post());
            if ($component != 'false') {
                get_template_part('advanced-archive/cards' . $component);
            } else {
                include('inc/default/post-template.php');
            }
            $postData .= ob_get_contents();
            ob_end_clean();
        }
        wp_reset_postdata();
        array_push($postsTxt, $postData);


        //Response
        if ($postsTxt[0] != '') {
            return array(
                'status' => true,
                'posts' => $postsTxt[0],
                'pages' => $full_posts->max_num_pages,
                'current_page' => intval($page),
                'filters' => $filters,
                'controllers' => $controller
            );
        } else {
            return array(
                'status' => false,
                'message' => __($noResultsMessage, 'advancedarchive')
            );
        }
    }
}

$advancedArchive = new AdvancedArchive();

?>