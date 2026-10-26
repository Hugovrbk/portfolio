document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.aura-voting[data-clip-id]').forEach(function (voting) {
        voting.querySelectorAll('button[data-vote]').forEach(function (button) {
            button.addEventListener('click', async function () {
                const nextVote = Number(button.dataset.vote);
                const currentVote = Number(voting.dataset.vote || 0);
                const vote = currentVote === nextVote ? 0 : nextVote;
                const buttons = voting.querySelectorAll('button[data-vote]');
                buttons.forEach(function (item) { item.disabled = true; });
                try {
                    const response = await fetch(window.STUDENT_MAP_CONFIG.baseUrl + 'api/clip-vote.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-CSRF-Token': window.STUDENT_MAP_CONFIG.csrfToken
                        },
                        body: new URLSearchParams({ clip_id: voting.dataset.clipId, vote: String(vote) })
                    });
                    const result = await response.json();
                    if (!response.ok || !result.success) throw new Error(result.message || 'Vote impossible.');
                    voting.dataset.vote = String(result.user_vote);
                    voting.querySelector('.aura-score strong').textContent = result.aura;
                    voting.querySelector('.upvote-count').textContent = result.upvotes;
                    voting.querySelector('.downvote-count').textContent = result.downvotes;
                    buttons.forEach(function (item) {
                        const selected = Number(item.dataset.vote) === result.user_vote;
                        item.classList.toggle('is-selected', selected);
                        item.setAttribute('aria-pressed', selected ? 'true' : 'false');
                    });
                } catch (error) {
                    window.alert(error.message || 'Le vote n’a pas pu être enregistré.');
                } finally {
                    buttons.forEach(function (item) { item.disabled = false; });
                }
            });
        });
    });
});
