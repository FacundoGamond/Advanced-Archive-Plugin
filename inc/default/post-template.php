<?php $post = $newpost; ?>

<article class="c-post">
    <a href="<?= get_the_permalink($post); ?>">
        <img class="c-post__thumbnail" src="<?= get_the_post_thumbnail_url($post, 'medium') ?>" alt="<?= get_the_title($post); ?>">
        <h4 class="c-post__title"><?= get_the_title($post); ?></h4>
        <p class="c-post__brief">
            <?= wp_trim_words(strip_shortcodes(get_the_content($post)), 8, null); ?>
        </p>
    </a>
</article>