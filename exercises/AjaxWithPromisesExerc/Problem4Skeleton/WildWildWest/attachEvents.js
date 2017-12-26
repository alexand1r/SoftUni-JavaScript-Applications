function attachEvents() {
    const user = {
        username: "guest",
        password: "guest"
    };

    let hostInfo = {
        appId: "kid_SkkdDVYWe",
        base: "wildwest",
        headers: {
            Authorization: "Basic " + btoa(user.username + ":" + user.password),
            "content-type": "application/json"
        }
    };
    hostInfo.host = `https://baas.kinvey.com/appdata/${hostInfo.appId}/${hostInfo.base}`;

    $('#addPlayer').click(createPlayer);
    loadPlayers();
    class Player {
        constructor(name, money, bullets) {
            this.name = name;
            this.money = money;
            this.bullets = bullets;
            if (!money)
                this.money = 500;
            if (!bullets)
                this.bullets = 6;
        }
    }

    function createPlayer() {
        let player = new Player($('#addName').val());

        $.post({
            url: hostInfo.host,
            headers: hostInfo.headers,
            data: JSON.stringify(player)
        })
            .then(player => displayPlayers([player], 'added'))
            .catch(displayError);
    }

    function loadPlayers() {
        $.get({
            url: hostInfo.host,
            headers: hostInfo.headers
        })
            .then(displayPlayers)
            .catch(displayError);
    }

    function displayPlayers(players, option) {
        if (option != 'added')
            $('#players').empty();
        for (let player of players)
            templatePlayer(player).appendTo('#players')
    }

    function play(player) {
        let actions = [
            $('#canvas').show(),
            $('#buttons').children().show(),
            loadCanvas(player),
            $('#reload').click(() => reload(player)),
            $('#save').click(() => save(player)),
            $('#players .play').attr('disabled', 'disabled'),
            $(`#players .player[data-id="${player._id}"] .delete`)
                .attr('disabled', 'disabled')
        ];

        Promise.all(actions)
            .catch(displayError);
    }

    function save(player) {
        let updatePlayerStats = function () {
            $(`div [data-id="${player._id}"] .money`).text(player.money);
            $(`div [data-id="${player._id}"] .bullets`).text(player.bullets);
        };
        let actions = [
            // update player data
            $.ajax({
                method: "PUT",
                url: hostInfo.host + `/${player._id}`,
                headers: hostInfo.headers,
                data: JSON.stringify(player)
            }).catch(displayError),
            // hide and unbind handles on save and reload buttons
            $('#buttons').children().unbind().hide(),
            $('#players .play').removeAttr('disabled'),,
            $(`#players .player[data-id="${player._id}"] .delete`)
                .removeAttr('disabled'),
            $('#canvas').hide(),
            clearInterval($('#canvas')[0].intervalId),
            updatePlayerStats()
        ];

        Promise.all(actions)
            .catch(displayError);
    }

    function reload(player) {
        player.money -= 60;
        player.bullets = 6;
    }

    function deletePlayer(id) {
        $(`#players .player[data-id="${id}"]`).remove();

        $.ajax({
            method: "DELETE",
            url: hostInfo.host + `/${id}`,
            headers: hostInfo.headers
        })
            .catch(displayError);
    }

    function displayError(error) {
        console.log(error);
    }

    function templatePlayer(player) {
        let btnPlay = $(`<button class="play">Play</button>`)
            .click(() => play(player));
        let btnDelete = $(`<button class="delete">Delete</button>`)
            .click(() => deletePlayer(player._id));

        return $(`
					<div class="player" data-id="${player._id}">
						<div class="row">
							<label>Name:</label>
							<label class="name">${player.name}</label>
						</div>
						<div class="row">
							<label>Money:</label>
							<label class="money">${player.money}</label>
						</div>
						<div class="row">
							<label>Bullets:</label>
							<label class="bullets">${player.bullets}</label>
						</div>
					</div>
					`)
            .append(btnPlay).append(btnDelete);
    }
}