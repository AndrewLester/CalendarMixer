from app.exts import db


class OAuth1Token(db.Model):
    id = db.Column(db.Integer, nullable=False, primary_key=True)
    name = db.Column(db.String(20), nullable=False)

    oauth_token = db.Column(db.String(48), nullable=False)
    oauth_token_secret = db.Column(db.String(48))
    # Unique is True for a one to one relationship
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), unique=True)
    user = db.relationship('User', back_populates='oauth_token')

    def to_token(self):
        return dict(
            oauth_token=self.oauth_token,
            oauth_token_secret=self.oauth_token_secret,
        )
