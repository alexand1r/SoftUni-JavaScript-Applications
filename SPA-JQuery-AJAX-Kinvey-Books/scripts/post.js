import {get, post, update, remove} from './requester';
import observer from './observer';

function loadPosts(callback) {
    get('appdata', 'posts/?query={}&sort={"date":-1}', 'kinvey')
        .then(callback,observer.showInfo("Loading..."));
}
function loadPostsHome(callback) {
    get('appdata', 'posts/?query={}&sort={"date":-1}&limit=10', 'kinvey')
        .then(callback, observer.showInfo("Loading..."));
}

function loadRecentPosts(callback) {
    get('appdata','posts/?query={}&sort={"date":-1}&limit=5', 'kinvey')
        .then(callback,observer.showInfo("Loading..."));
}

function loadPostDetails(postId, onPostSuccess) {
    get('appdata', 'posts/' + postId, 'kinvey')
        .then(onPostSuccess,observer.showInfo("Loading..."));
}

function loadUsersDetails(postId, onUsersSuccess) {
    get('user', `?query={"post_id": "${postId}"}`, 'kinvey')
        .then(onUsersSuccess,observer.showInfo("Loading..."));
}

function loadTagsDetails(postId, onTagsSuccess) {
    get('appdata', `tags/?query={"post_id": "${postId}"}`, 'kinvey')
        .then(onTagsSuccess,observer.showInfo("Loading..."));
}

function loadCommentsDetails(postId, onCommentsSuccess) {
    get('appdata', `comments/?query={"post_id": "${postId}"}`, 'kinvey')
        .then(onCommentsSuccess,observer.showInfo("Loading..."));
}

function loadImageDetails(onImageSuccess) {
    get('blob', '', 'kinvey')
        .then(onImageSuccess);
}

function edit(postId, title, body, tagId, tagBody, callback) {
    console.log(tagId);
    console.log(tagBody);
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth()+1; //January is 0!
    let yyyy = today.getFullYear();
    if(dd<10) {
        dd='0'+dd
    }
    if(mm<10) {
        mm='0'+mm
    }
    today = mm+'/'+dd+'/'+yyyy;

    let postData = {
        title: title,
        body: body,
        author: sessionStorage.getItem('username'),
        date: today
    };
    update('appdata', 'posts/' + postId, postData, 'kinvey')
        .then((response) => {
            editTags(response._id, tagId, tagBody, callback)
        });

}

function editTags(postId, tagId, tagBody, callback) {
    let tagsData = {
        body: tagBody,
        post_id: postId
    };
    update('appdata', 'tags/' + tagId, tagsData, 'kinvey')
        .then(callback(true),observer.showSuccess("Post Edited ! "))
        .catch(callback(false));

}

function deletePost(postId, callback) {
    remove('appdata', 'posts/' + postId, 'kinvey')
        .then(callback(true),observer.showSuccess("Post Deleted ! "))
        .catch(callback(true));
}


function create(title, body, tags, callback) {
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1; //January is 0!
    let yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    today = mm + '/' + dd + '/' + yyyy;

    let postData = {
        title: title,
        body: body,
        author: sessionStorage.getItem('username'),
        date: today
    };
    post('appdata', 'posts', postData, 'kinvey')
        .then((response) => {
            createTags(response._id, tags, callback)
        });
}

function createTags(postId, body, callback) {
    let tagsData = {
        body: body,
        post_id: postId
    };
    post('appdata', 'tags', tagsData, 'kinvey')
        .then(saveImage(postId, callback));

}

function saveImage(postId, callback) {
    let file = $('#uploaded-file')[0].files[0];

    let metaData = {
        '_filename': file.name,
        'size': file.size,
        'mimeType': file.type,
        'post_id': postId
    };

    upload(metaData, file, callback);
}

function upload(data, file, callback) {
    post('blob', '', JSON.stringify(data), 'image', data)
        .then(function (success) {
            console.log(success);

            let innerHeaders = success._requiredHeaders;
            innerHeaders['Content-Type'] = file.type;
            let uploadUrl = success._uploadURL;

            $.ajax({
                method: 'PUT',
                url: uploadUrl,
                headers: innerHeaders,
                processData: false,
                data: file
            })
                .then(function(success) {
                    console.log(success);
                    console.log('upload success')
                })
                .then(callback(true),observer.showSuccess("Post Created!"))
                .catch(callback(false));
        })
        .catch(function (error) {
            console.log(error);
        });
}

function create_comment(postId, body, callback) {
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1; //January is 0!
    let yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    today = mm + '/' + dd + '/' + yyyy;

    let commentData = {
        body: body,
        post_id: postId,
        author: sessionStorage.getItem('username'),
        date: today
    };
    post('appdata', 'comments', commentData, 'kinvey')
        .then(callback(true))
        .catch(callback(true));
}

export {loadPosts, loadRecentPosts, loadPostDetails, loadUsersDetails, loadTagsDetails, loadCommentsDetails, edit, create, deletePost, create_comment, loadImageDetails,loadPostsHome};
