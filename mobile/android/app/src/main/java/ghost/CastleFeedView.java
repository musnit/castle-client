package ghost;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.GridView;
import android.widget.ImageView;
import android.widget.TextView;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.view.SimpleDraweeView;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.Nullable;

import androidx.annotation.NonNull;
import xyz.castle.R;

public class CastleFeedView extends SimpleViewManager<ViewGroup> {

    private FeedViewAdapter mAdapter;
    private Context mContext;

    private class Deck {
        String url;

        Deck(String url) {
            this.url = url;
        }
    }

    private class FeedViewAdapter extends BaseAdapter {
        private List<Deck> mDecks;

        FeedViewAdapter() {
            this.mDecks = new ArrayList<>();
        }

        void updateDecks(ReadableArray decks) {
            mDecks.clear();

            for (int i = 0; i < decks.size(); i++) {
                ReadableMap deck = decks.getMap(i);
                ReadableMap backgroundImage = deck.getMap("initialCard").getMap("backgroundImage");
                String cardBackgroundUrl = backgroundImage.getString("smallUrl") + "&mask=corners";//&corner-radius=20";

                mDecks.add(new Deck(cardBackgroundUrl));
            }

            notifyDataSetChanged();
        }

        @Override
        public int getCount() {
            return mDecks.size();
        }

        @Override
        public Object getItem(int i) {
            return null;
        }

        @Override
        public long getItemId(int i) {
            return 0;
        }

        @Override
        public View getView(int i, View view, ViewGroup viewGroup) {
            Deck deck = mDecks.get(i);

            if (view == null) {
                final LayoutInflater layoutInflater = LayoutInflater.from(mContext);
                view = layoutInflater.inflate(R.layout.deck_feed_item, null);
            }


            final SimpleDraweeView backgroundImageView = (SimpleDraweeView)view.findViewById(R.id.background_image_view);
            backgroundImageView.setImageURI(deck.url);

            /*final SimpleDraweeView creatorPhotoView = (SimpleDraweeView)view.findViewById(R.id.avatar_image_view);
            creatorPhotoView.setImageURI(creatorPhotoUrl);

            final TextView usernameView = (TextView)view.findViewById(R.id.username_text_view);
            usernameView.setText(username);*/

            view.setLayoutParams(new ViewGroup.LayoutParams(400, 600));

            return view;
        }
    }

    @NonNull
    @Override
    public String getName() {
        return "CastleFeedView";
    }

    @NonNull
    @Override
    protected ViewGroup createViewInstance(@NonNull ThemedReactContext reactContext) {
        GridView view = new GridView(reactContext);
        view.setColumnWidth(400);
        view.setNumColumns(GridView.AUTO_FIT);
        view.setVerticalSpacing(24);
        view.setHorizontalSpacing(10);
        view.setStretchMode(GridView.STRETCH_SPACING_UNIFORM);

        mAdapter = new FeedViewAdapter();
        view.setAdapter(mAdapter);
        mContext = reactContext;
        return view;
    }

    @ReactProp(name = "decks")
    public void setDecks(ViewGroup view, @Nullable ReadableArray decks) {
        mAdapter.updateDecks(decks);
    }
}
