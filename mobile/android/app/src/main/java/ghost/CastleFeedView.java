package ghost;

import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.GridView;

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

    private static class Deck {
        String url;

        Deck(String url) {
            this.url = url;
        }
    }

    public static class FeedViewAdapter extends BaseAdapter {
        private List<Deck> mDecks;
        private Context mContext;

        public FeedViewAdapter(Context context) {
            mDecks = new ArrayList<>();
            mContext = context;
        }

        public void setTestDecks() {
            List<String> urls = new ArrayList<>();
            urls.add("https://castle.imgix.net/1ca3e2a09d1718099554fa88b5af512b?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/70f05824f8150dd74d8827789cb5df41?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/b18c0ff207af2d16e296ce602ff35368?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/8312d4fdb63c322ee276b4bee3131fda?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/82431311ea66034ea585ee7b21f4e650?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/a8857cf38b752bff0bd04fb31f1f9109?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/6d2d4306657df3b328a36e98277a76fe?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/9ae64a1ca042ae3885dd8fda920c2d02?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/a92c56c0cccd44f21a5496d4878780d8?auto=compress&ar=5:7&fit=crop&w=420");
            urls.add("https://castle.imgix.net/0142a9c06fbaeb5fd54189d526a77ce3?auto=compress&ar=5:7&fit=crop&w=420");


            mDecks.clear();

            for (int i = 0; i < 100; i++) {
                mDecks.add(new Deck(urls.get(i % urls.size())));
            }

            notifyDataSetChanged();
        }

        void updateDecks(ReadableArray decks) {
            mDecks.clear();

            for (int i = 0; i < decks.size(); i++) {
                ReadableMap deck = decks.getMap(i);
                ReadableMap backgroundImage = deck.getMap("initialCard").getMap("backgroundImage");
                String cardBackgroundUrl = backgroundImage.getString("smallUrl");// + "&mask=corners";//&corner-radius=20";

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
            //backgroundImageView.setBackgroundColor(Color.RED);

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
    public ViewGroup createViewInstance(@NonNull ThemedReactContext reactContext) {
        GridView view = new GridView(reactContext);
        view.setColumnWidth(400);
        view.setNumColumns(GridView.AUTO_FIT);
        view.setVerticalSpacing(24);
        view.setHorizontalSpacing(10);
        view.setStretchMode(GridView.STRETCH_SPACING_UNIFORM);

        mAdapter = new FeedViewAdapter(reactContext);
        view.setAdapter(mAdapter);
        return view;
    }

    @ReactProp(name = "decks")
    public void setDecks(ViewGroup view, @Nullable ReadableArray decks) {
        mAdapter.updateDecks(decks);
    }
}
